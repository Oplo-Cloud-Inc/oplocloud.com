/* ==========================================================================
   Media Arts — Unit 7, Video Basics. Sections 7.1 to 7.8.

   Written from the EHS course text the same way as Units 5 and 6: curated
   rather than copied. Every definition a section tests on is here, and every
   idea is shown as well as said. This unit is about space — where a camera
   stands, which way it points, how it moves, what the frame leaves out — so
   most of its teaching is done by diagrams drawn to show exactly that: the
   180-degree rule from above, the dolly zoom from above, shot sizes as
   nested frames, camera moves as arrows on one camera. Every picture opens
   full screen, and every label in a diagram is set large enough to read in
   the column.

   ------------------------------------------------------------ Corrections

   The source text is wrong in more places than any earlier unit. Each
   correction is marked in the reader with a note rather than silently
   rewritten, so a teacher comparing against the textbook can see what
   changed and why.

     7.1  "The image sensor is the internal mechanical device." It is an
          electronic chip with no moving parts.
     7.1  Early camcorder tapes "were essentially frame after frame of
          rapidly recorded still images" that "mirrored the film used in film
          cameras". Film holds visible pictures in a row; videotape stores the
          picture as a magnetic signal, and nothing on it looks like an image.
     7.2  Nitrate was "the first … film available for video recordings". It
          was motion-picture film; video did not exist until the 1950s.
     7.2  Acetate's "only disadvantage" is that a jam can damage the camera.
          The reverse: acetate tears, which protects the camera, and that is
          why camera negative is acetate. Polyester damages the machine.
          Acetate's real weakness is vinegar syndrome.
     7.2  LaserDisc was "the first commercial digital recording tool … most
          commonly used for home video recording". It was analog, and it was
          a playback format for pre-recorded films.
     7.2  DVD "is an anagram". It is an abbreviation.
     7.2  "Hard drives can now hold as much data as 1,000 CDs." A 20 TB drive
          holds roughly 28,000.
     7.2  Cloud storage "does not have a physical component". It lives on
          physical servers; the user simply does not own or see them.
     7.2  Linear editing "meant the editor had to physically cut and tape
          together pieces of film". That is film splicing. Linear video
          editing copied from tape to tape. And non-linear editing did not
          begin in the early 1990s: the CMX 600 dates from 1971, and practical
          systems (EMC2, Avid/1) from 1989.
     7.3  Crossing the line "creates a reverse angle". It flips screen
          direction; ordinary reverse shots stay on one side of the line.
     7.3  "Full shots often use the 4×3 aspect ratio." Shot size and aspect
          ratio are independent.
     7.3  "The fish-eye view is a distorted version of the high-angle shot."
          A fisheye is a lens, usable from any angle.
     7.4  "A panning shot can also be angled if it is following a subject up
          a stairwell." Up and down is a tilt.
     7.4  Focus pull and rack focus are "the same". A focus puller keeps focus
          right through a shot; a rack focus is a deliberate, visible shift.
     7.4  Stabilizers are "a series of counterweights and gyroscopes" and
          "often used for business videos". A Steadicam balances the camera on
          a sled with counterweights, a gimbal and a sprung arm on a vest;
          gyros are an optional extra. Its fame came from feature films.
     7.5  "The rule of thirds, or the Golden Ratio" — the same conflation as
          6.6, corrected the same way.
     7.5  "Producers make certain to create tangents." In composition a
          tangent is an awkward touching of edges, usually avoided; what the
          text describes is a leading line.
     7.6  The sound editor "assembles and prepares the final sound mixing"
          and records sounds with objects. The final mix is the re-recording
          mixer's; performed sound effects are Foley.
     7.6  A teleprompter is "always placed out of the camera's frame". Its
          glass sits directly in front of the lens, and the camera shoots
          through it.
     7.7  A jump cut is taken "with cameras filming at slightly different
          angles". Its defining feature is a jump in time at nearly the same
          angle; editors avoid it by moving the camera 30 degrees or more.
     7.7  Crossfades "are considered a form of continuity editing". A dissolve
          usually signals that time has passed or the place has changed.
     7.8  Frame rates work "because the human brain can only identify a
          certain number of individual images … the images begin to blur
          together". Motion is perceived from the differences between frames,
          not from images lingering; see Anderson and Anderson (1993).
     7.8  A side note about jump cuts is printed next to aspect ratios, and
          cuts are called "special effects". Both removed.

   ------------------------------------------------------------------ Checks

   7.2, 7.3, 7.4, 7.5, 7.7 and 7.8 use the course's own Check Your
   Understanding questions; 7.2's is reworded, because its stem repeats the
   LaserDisc error, and 7.4's names the technique correctly. 7.1 and 7.6 had
   interactive exercises instead, so their checks are new and written against
   the section's own text.

   ---------------------------------------------------------------- Sources

   Each section ends with its sources and further reading, set at reading
   size. Every link was checked when this was written. Photographs are from
   Wikimedia Commons, each verified at its source for licence and author and
   credited beside the figure; diagrams are drawn for OEdu.

   ------------------------------------------------------------------ Video

   As in Unit 6: the section videos are not in this repository, so none is
   wired up. Add the file to learn/media/ and a `video:` line to the section.
   ========================================================================== */
window.OPLO_UNIT7 = (function () {
  "use strict";

  var P = function (t) { return { k: "p", t: t }; };
  var H = function (t) { return { k: "h", t: t }; };
  var D = function (t, d) { return { k: "def", t: t, d: d }; };
  var Q = function (t, s) { return { k: "quote", t: t, s: s }; };
  var N = function (t) { return { k: "note", t: t }; };
  var L = function (t, items) { return { k: "list", t: t, items: items }; };
  var R = function (items) { return { k: "refs", items: items }; };
  // A figure: images with real dimensions and alt text, a caption, and the
  // credit its licence asks for. See figureBlock in app.js.
  var F = function (o) {
    return { k: "fig", imgs: o.imgs, cap: o.cap, credits: o.credits,
             cols: o.cols || null, natural: !!o.natural,
             diagram: !!o.diagram, size: o.size || null };
  };

  var M = "media/unit7/";
  var OEDU = [{ what: "Diagram", by: "OEdu" }];
  function commons(file) { return "https://commons.wikimedia.org/wiki/File:" + file; }
  var BY2 = "https://creativecommons.org/licenses/by/2.0/";
  var BY25 = "https://creativecommons.org/licenses/by/2.5/";
  var BY3 = "https://creativecommons.org/licenses/by/3.0/";
  var BYSA2 = "https://creativecommons.org/licenses/by-sa/2.0/";
  var BYSA3 = "https://creativecommons.org/licenses/by-sa/3.0/";
  var BYSA4 = "https://creativecommons.org/licenses/by-sa/4.0/";
  var CC0 = "https://creativecommons.org/publicdomain/zero/1.0/";

  return [{
    n: "7.1", t: "Moving Pictures", kicker: "The camcorder",
    stand: "A video is a run of still pictures shown fast enough to move. A camcorder is the machine that " +
           "makes and keeps them — a camera and a recorder, finally in one body.",
    mins: 8,
    objectives: ["Briefly summarise the history of the camcorder",
                 "Identify the major parts of a camcorder"],
    body: [
      H("Pictures that move"),
      P("Every video, from a phone clip to a feature film, is a sequence of still images — frames — shown one " +
        "after another. Show them quickly enough and the brain stops seeing separate pictures and sees motion " +
        "instead. How that happens is the subject of 7.8; the fact of it is where video begins."),
      F({ imgs: [{ src: M + "7-1-horse-in-motion.jpg", w: 1400, h: 863,
                   alt: "A grid of small sepia photographs of a jockey riding a galloping horse, each taken a " +
                        "fraction of a second after the one before, so that the horse's legs are in a different " +
                        "position in every frame." }],
          cap: "Eadweard Muybridge's The Horse in Motion (1878): photographs taken a fraction of a second apart. " +
               "Seen one at a time they are stills. Played in order, fast, they gallop — the principle behind " +
               "every video since.",
          credits: [{ by: "Eadweard Muybridge", byUrl: commons("The_Horse_in_Motion_high_res.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("The_Horse_in_Motion_high_res.jpg"),
                      license: "Public domain" }] }),
      H("A camera and a recorder, in one body"),
      D("Camcorder", "An electronic device that combines a video camera and a video recorder in one body. The " +
        "name joins the two words."),
      P("Before camcorders, a video camera and the recorder that stored its pictures were separate machines, " +
        "joined by a cable — and on location, often carried by two people. Folding both into one body is what " +
        "put video in ordinary hands."),
      P("Sony's Betamovie, sold in 1983, was the first consumer camcorder. It could record but not play back. " +
        "JVC's GR-C1 followed in 1984 on a compact VHS-C cassette, and let its owner watch the tape back in " +
        "the viewfinder."),
      F({ imgs: [{ src: M + "7-1-sony-betamovie.jpg", w: 800, h: 600, label: "1983 · Sony Betamovie",
                   alt: "A large grey Sony Betamovie BMC-100P camcorder with a long lens, a handle on top and an " +
                        "eyepiece at the back, standing on a table." },
                 { src: M + "7-1-jvc-gr-c1.jpg", w: 800, h: 800, label: "1984 · JVC GR-C1",
                   alt: "A compact silver and black JVC Victor GR-C1 camcorder seen from the front and side, with " +
                        "its lens, microphone and viewfinder." }],
          cap: "The first two consumer camcorders. The Betamovie recorded to a Betamax cassette but had no way to " +
               "play it back; the GR-C1 could replay what it had just shot.",
          credits: [{ what: "Betamovie", by: "David162se", byUrl: commons("Sony_Betamovie_BMC-100P.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Sony_Betamovie_BMC-100P.jpg"),
                      license: "CC BY-SA 4.0", licenseUrl: BYSA4 },
                    { what: "GR-C1", by: "Ignat Gorazd", byUrl: commons("JVC_Victor_GR-C1_camcorder_front_side_view.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("JVC_Victor_GR-C1_camcorder_front_side_view.jpg"),
                      license: "CC BY-SA 2.0", licenseUrl: BYSA2 }] }),
      P("Those early camcorders recorded an analog signal onto magnetic videotape. Digital camcorders arrived " +
        "in the mid-1990s, still on tape at first, and today almost all record digital files to memory cards. " +
        "Phones and cameras now record video too, but a dedicated camcorder still offers a long optical zoom, " +
        "a grip made for holding steady, and hours of recording."),
      N("<b>A correction to the course text.</b> It says early videotapes were “frame after frame of rapidly " +
        "recorded still images” that mirrored film. Film really does hold a row of visible pictures. Videotape " +
        "does not: it stores the picture as a magnetic signal, written in thin diagonal stripes by a spinning " +
        "head, and nothing on the tape looks like an image."),
      H("The parts of a camcorder"),
      F({ imgs: [{ src: M + "7-1-camcorder-parts.svg", w: 700, h: 470,
                   alt: "Diagram of a camcorder from the side, labelled: lens at the front, microphone and zoom " +
                        "control on top, viewfinder at the back, battery and DC in socket at the rear, memory card " +
                        "slot in the side, fold-out LCD screen below, and the image sensor inside the body just " +
                        "behind the lens, with rays of light from the lens converging on it." }],
          cap: "Light enters through the lens and is focused onto the image sensor inside the body. Everything " +
               "else either controls that picture, shows it to you, powers the camera, or stores what it records.",
          credits: OEDU, diagram: true }),
      L("What each part does", [
        ["Lens", "Where light enters. It focuses the scene onto the sensor, and its zoom brings the subject " +
         "closer or pushes it away."],
        ["Zoom control", "A rocker switch, usually on top, that drives the zoom — placed where one finger can " +
         "reach it while the eye stays at the viewfinder."],
        ["Viewfinder", "A small eyepiece showing the frame being recorded, useful in bright sun."],
        ["LCD screen", "A larger screen that folds out from the body, easier to see than the viewfinder."],
        ["Microphone", "Records the sound around the camera. Its quality depends on the model, and many have an " +
         "automatic setting."],
        ["Battery", "Almost always rechargeable today. Early camcorders took replaceable batteries."],
        ["Memory card", "A removable card that stores the video. It can be taken out and read by a computer for " +
         "editing."],
        ["Image sensor", "The chip that turns the focused light into an electronic signal."],
        ["AC adapter", "Powers the camcorder from a wall socket for long recordings, so the battery is not drained."]
      ]),
      D("Image sensor", "The electronic chip behind the lens that converts light into an electrical signal, so " +
        "the picture can be recorded. The two main kinds are CCD and CMOS."),
      N("<b>A correction to the course text.</b> It calls the image sensor “the internal mechanical device”. " +
        "It is an electronic chip, with no moving parts at all."),
      F({ imgs: [{ src: M + "7-1-sony-handycam.jpg", w: 1000, h: 750,
                   alt: "A small black Sony Handycam HDR-PJ200 camcorder on a white surface, with a large Carl " +
                        "Zeiss lens at the front and a hand strap on the side." }],
          cap: "A modern camcorder, Sony's Handycam HDR-PJ200. Everything the 1983 Betamovie did now fits in a " +
               "hand, records to a memory card, and adds a fold-out screen.",
          credits: [{ by: "2538O", byUrl: commons("Sony_Handycam_HDR-PJ200E.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Sony_Handycam_HDR-PJ200E.jpg"),
                      license: "CC0", licenseUrl: CC0 }] }),
      R([
        { by: "Science Museum Group", title: "Sony Betamovie camcorder",
          pub: "Science Museum Group Collection",
          url: "https://collection.sciencemuseumgroup.org.uk/objects/co8068337/sony-betamovie-camcorder" },
        { by: "Blain Brown", year: "2016", title: "Cinematography: Theory and Practice", pub: "3rd ed., Routledge",
          note: "Chapters on cameras and sensors, written for working camera crews." }
      ])
    ],
    check: { q: "Which part of a camcorder converts the light focused by the lens into an electronic signal?",
             opts: ["The viewfinder", "The image sensor", "The memory card", "The zoom control"], right: 1,
             why: "The image sensor. The lens focuses light onto it, it turns the light into a signal, and the " +
                  "memory card stores the result." }
  }, {
    n: "7.2", t: "Recording Video", kicker: "From film to files",
    stand: "Moving pictures have been kept on film that could burn, tape you could not see into, discs read " +
           "by lasers, and servers you will never visit. Each change solved one problem and made a new one.",
    mins: 11,
    objectives: ["Summarise the transition from film recording to digital recording",
                 "Identify some of the devices used to store digital recordings",
                 "Summarise the transition from linear editing to non-linear editing"],
    body: [
      F({ imgs: [{ src: M + "7-2-recording-media-timeline.svg", w: 700, h: 540,
                   alt: "Timeline from 1880 to today in six lanes. Film: nitrate from 1889 to 1951, acetate safety " +
                        "film from 1909 onward. Tape: videotape 1956, VHS 1976, the first consumer camcorder 1983. " +
                        "Optical disc: LaserDisc 1978, which was analog, CD 1982, DVD 1996. Hard drive: IBM 350 in " +
                        "1956. Flash: SD card 1999, USB flash drive 2000. Cloud: Amazon S3 in 2006." }],
          cap: "The whole section on one line. The media overlap: film never disappeared when tape arrived, and " +
               "hard drives were storing data for twenty years before anyone recorded video on one.",
          credits: OEDU, diagram: true }),
      H("Film"),
      D("Nitrate film", "The first flexible, transparent film for motion pictures, on a base of cellulose " +
        "nitrate. Used from 1889 until about 1951."),
      P("Nitrate made the film industry possible and nearly destroyed its history. It is extremely flammable — " +
        "it burns fiercely and is very hard to put out — and it decays: first turning sticky, then to a brown " +
        "powder. A great deal of early cinema survives only as a title in a catalogue."),
      F({ imgs: [{ src: M + "7-2-nitrate-decay.jpg", w: 486, h: 373,
                   alt: "An open metal film can containing a reel of old nitrate film that has decayed into a " +
                        "brown, bubbled, crumbling mass." }],
          cap: "A can of decomposing nitrate film at the Library of Congress. Once decay has gone this far, the " +
               "pictures on it are gone.",
          credits: [{ by: "Library of Congress", byUrl: commons("Decomposing_Nitrate_Film.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Decomposing_Nitrate_Film.jpg"),
                      license: "CC BY 3.0", licenseUrl: BY3 }], size: "medium" }),
      N("<b>A correction to the course text.</b> It calls nitrate the first film “available for video " +
        "recordings”. Nitrate was motion-picture film. Video — a picture recorded as an electronic signal — " +
        "did not exist until the 1950s."),
      D("Safety film", "Film on a base of cellulose acetate, which does not burn like nitrate. Kodak introduced " +
        "acetate for amateur film in 1909; a tougher triacetate replaced nitrate in professional film between " +
        "1948 and 1951."),
      P("Safety film solved the fire problem and brought its own. As acetate ages it can release acetic acid — " +
        "the smell of vinegar — and the acid speeds up its own decay. Archives call it vinegar syndrome."),
      N("<b>A correction to the course text.</b> It says acetate's only disadvantage is that a jammed camera " +
        "can be damaged by it. It is the other way round. Acetate tears in a jam, which protects the camera — " +
        "that is exactly why camera film is still acetate. Polyester film is so strong that a jam damages the " +
        "machine instead, so it is used for prints, not in cameras."),
      H("Discs read by light"),
      D("LaserDisc", "The first commercial optical video disc, read by a laser. MCA DiscoVision launched it in " +
        "Atlanta in December 1978. It played pre-recorded films, and stored the picture as an analog signal."),
      F({ imgs: [{ src: M + "7-2-laserdisc-vs-dvd.png", w: 903, h: 629,
                   alt: "A silver LaserDisc, about the size of a vinyl LP, next to a much smaller DVD." }],
          cap: "A LaserDisc beside a DVD. The LaserDisc is thirty centimetres across — the size of an LP — and " +
               "still holds its picture as an analog signal. The DVD is digital, and far smaller.",
          credits: [{ by: "Kevin586", byUrl: commons("LDDVDComparison-mod.png"),
                      site: "Wikimedia Commons", siteUrl: commons("LDDVDComparison-mod.png"),
                      license: "CC BY-SA 3.0", licenseUrl: BYSA3 }] }),
      N("<b>A correction to the course text.</b> It calls LaserDisc “the first commercial digital recording " +
        "tool”, used “for home video recording”. LaserDisc was analog, and it was a way to watch films bought " +
        "on disc — nobody recorded their own video onto one."),
      P("The compact disc, developed by Philips and Sony and introduced in 1982, was digital from the start. " +
        "It was made for music, and adapted as the CD-ROM to store about 700 megabytes of any kind of data. " +
        "The DVD — digital versatile disc — followed in 1996, holding 4.7 gigabytes on a single layer, enough " +
        "for a full-length film."),
      N("<b>Two corrections.</b> DVD is not an anagram; it is an abbreviation. And the text says a hard drive " +
        "now holds as much as 1,000 CDs. A 20-terabyte drive holds about 28,000."),
      H("Drives, cards and the cloud"),
      D("Hard drive", "A storage device that records data magnetically on rapidly spinning platters, and keeps " +
        "it when the power is off."),
      F({ imgs: [{ src: M + "7-2-hard-drive.jpg", w: 730, h: 656,
                   alt: "An opened hard disk drive with its parts labelled: the shiny platter, the actuator arm " +
                        "with the read-write head at its tip, the spindle and the circuit connectors." }],
          cap: "Inside a hard drive: the data sits on the mirror-like platter, and a head on the end of the arm " +
               "reads and writes it, a hair's breadth above the spinning surface.",
          credits: [{ by: "Imicrokallol", byUrl: commons("Internal_components_of_Hard_disk_drive.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Internal_components_of_Hard_disk_drive.jpg"),
                      license: "CC BY-SA 4.0", licenseUrl: BYSA4 }], size: "medium" }),
      D("Flash memory", "Storage on chips with no moving parts. It keeps data without power and can be erased " +
        "and rewritten. USB flash drives (from 2000) and SD cards (from 1999) both use it."),
      P("The SD card — Secure Digital, developed by SanDisk, Panasonic and Toshiba — is the card inside most " +
        "camcorders and cameras. Its smaller sibling, microSD, sits in phones and drones."),
      F({ imgs: [{ src: M + "7-2-sd-microsd.jpg", w: 1200, h: 900,
                   alt: "A full-size SD card, a much smaller microSD card and a US ten-cent coin side by side on a " +
                        "table, for scale." }],
          cap: "An SD card, a microSD card and a dime. A microSD card smaller than the coin can hold hours of " +
               "high-definition video.",
          credits: [{ by: "Nashucks", byUrl: commons("Size_comparison_of_SD_card,_microSD_card,_and_dime.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Size_comparison_of_SD_card,_microSD_card,_and_dime.jpg"),
                      license: "CC0", licenseUrl: CC0 }] }),
      D("Cloud storage", "Data kept on servers in a provider's data centres and reached over the internet, " +
        "rather than on a drive the user owns."),
      N("<b>A correction to the course text.</b> It says cloud storage “does not have a physical component”. " +
        "It very much does — racks of drives in buildings run by the provider. What the user gives up is " +
        "owning, seeing and maintaining them."),
      H("Two ways to edit"),
      D("Linear editing", "Editing by copying shots in order from source tapes onto a master tape. To change an " +
        "early shot, everything after it has to be recorded again."),
      D("Non-linear editing", "Editing clips on a software timeline, where any shot can be moved, trimmed or " +
        "replaced at any point without re-recording the rest, and without altering the original footage."),
      F({ imgs: [{ src: M + "7-2-linear-vs-nonlinear.svg", w: 700, h: 500,
                   alt: "Top: linear editing, a source deck copying onto a record deck, with a master tape holding " +
                        "shots 1, 2 and 3 in order and a note that changing shot 2 means recording everything after " +
                        "it again. Bottom: non-linear editing, a software timeline with clips on a video track and a " +
                        "sound track, and clip 2 being dragged from the end to sit between clips 1 and 3." }],
          cap: "Linear editing is a queue: every shot after a change must be recorded again. Non-linear editing " +
               "is a table: pick up any clip, put it anywhere.",
          credits: OEDU, diagram: true }),
      P("Before video, film editors did cut the film itself. On machines like the Moviola and the Steenbeck " +
        "flatbed they viewed the footage, cut it with a splicer, and joined it with tape or cement — slow, " +
        "physical work, but they could reach any shot in any order."),
      F({ imgs: [{ src: M + "7-2-steenbeck.jpg", w: 1400, h: 875,
                   alt: "The deck of a Steenbeck flatbed film editing table: rows of white and grey rollers, " +
                        "sprockets and guides, with two sound heads labelled mag 1 and mag 2 in the middle." }],
          cap: "The deck of a 16mm Steenbeck flatbed editing table from the Danish Broadcasting Corporation's " +
               "archive. Picture and magnetic sound tracks (the heads marked mag 1 and mag 2) run past these " +
               "rollers in step, so an editor could watch, cut and splice both together.",
          credits: [{ by: "DRs Kulturarvsprojekt", byUrl: commons("Steenbeck_flatbed_16mm_ST921_(6498656327).jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Steenbeck_flatbed_16mm_ST921_(6498656327).jpg"),
                      license: "CC BY-SA 2.0", licenseUrl: BYSA2 }] }),
      N("<b>A correction to the course text.</b> It says linear editing meant physically cutting and taping " +
        "film. That is film splicing. Linear video editing never cut anything — it copied from one tape to " +
        "another. It also dates non-linear editing to the early 1990s: the first system, the CMX 600, appeared " +
        "in 1971, and practical ones — EMC2 and Avid/1 — in 1989."),
      P("Non-linear editing now dominates because it lets an editor try an idea, undo it, and try another. " +
        "Tape skills survive mainly in archives and among enthusiasts who prefer the old machines."),
      R([
        { by: "National Film Preservation Foundation", year: "2004",
          title: "The Film Preservation Guide: The Basics for Archives, Libraries, and Museums",
          pub: "National Film Preservation Foundation, San Francisco" },
        { by: "National Film Preservation Foundation", title: "Vinegar Syndrome", pub: "Preservation Basics",
          url: "https://www.filmpreservation.org/preservation-basics/vinegar-syndrome" },
        { by: "History of Information", title: "MCA DiscoVision Introduces the LaserDisc Format",
          pub: "historyofinformation.com", url: "https://www.historyofinformation.com/detail.php?id=5404" },
        { by: "Walter Murch", year: "2001", title: "In the Blink of an Eye", pub: "2nd ed., Silman-James Press",
          note: "An Oscar-winning editor on what changed when editing moved from film to computers." }
      ])
    ],
    check: { q: "LaserDisc, the first commercial optical disc for watching films at home, went on sale in which " +
                "year?",
             opts: ["1980", "1967", "1978", "1985"], right: 2,
             why: "1978, in Atlanta, as MCA DiscoVision. Remember that it was an analog format, not a digital one." }
  }, {
    n: "7.3", t: "The Camera's Role in Storytelling", kicker: "Cinematography",
    stand: "Where the camera stands decides what the audience feels. The same two actors, shot from above or " +
           "below, near or far, tell two different stories.",
    mins: 12,
    objectives: ["Define cinematography",
                 "Describe the 180-degree rule used in cinematography",
                 "Identify types of camera shots used in cinematography"],
    body: [
      D("Cinematography", "The art and craft of making the images of a motion picture: choosing the camera, " +
        "lens, framing, angle, movement and light."),
      P("Framing a shot is never neutral. How big the subject is in the frame, and where the camera looks from, " +
        "shape how a viewer reads a scene before anyone speaks."),
      H("The 180-degree rule"),
      D("180-degree rule", "Keep the camera on one side of an imaginary line — the axis of action — drawn between " +
        "two characters, so each stays on the same side of the frame from shot to shot."),
      F({ imgs: [{ src: M + "7-3-180-degree-rule.svg", w: 700, h: 540,
                   alt: "Overhead diagram: A and B face each other across a dashed line. Cameras 1, 2 and 3 sit on " +
                        "the shaded side of the line; beside them, their frames all show A on the left and B on the " +
                        "right. Camera 4, on the far side of the line, is marked crossed, and its frame shows B on " +
                        "the left and A on the right." }],
          cap: "Seen from above. Every camera on the green side shows A on the left and B on the right, however " +
               "close or wide the shot. Camera 4 has crossed the line, and the two people swap sides of the " +
               "screen — which reads as a jolt, as if they had switched places.",
          credits: OEDU, diagram: true }),
      P("The rule is really about the viewer's map of the scene. Keep the line and the audience always knows " +
        "who is where; break it and they have to work that out again, even if they cannot say what felt wrong. " +
        "Directors do cross the line on purpose — by moving the camera across it on screen, or cutting to a " +
        "shot taken straight down the line — so the audience sees the change happen."),
      N("<b>A correction to the course text.</b> It says crossing the line “creates a reverse angle”. What it " +
        "creates is a flip in screen direction. Reverse shots — cutting between two people in a conversation — " +
        "are normal, and they stay on the same side of the line."),
      H("Shot sizes"),
      F({ imgs: [{ src: M + "7-3-shot-sizes.svg", w: 700, h: 470,
                   alt: "Nested frames around one standing person in a landscape. The wide shot is the whole " +
                        "picture with a tree and a hill. The full shot frames the person head to toe. The medium " +
                        "shot frames them from the waist up. The close-up frames the head. The extreme close-up " +
                        "frames only the eyes and mouth." }],
          cap: "The same person at five shot sizes, each drawn as a frame of the same shape. A shot size is named " +
               "by what it holds, not by the lens used to get it.",
          credits: OEDU, diagram: true }),
      D("Establishing shot", "The first shot of a scene, usually wide or extremely wide, showing the audience " +
        "where the action is taking place."),
      D("Master shot", "A single, usually wide take that covers all the action and dialogue of a scene. The " +
        "closer shots are filmed afterwards and matched to it."),
      L("From far to near", [
        ["Extreme wide shot", "The surroundings are the subject. The person may be too small to see."],
        ["Very wide shot", "The subject is visible, just, but the place still dominates."],
        ["Wide or full shot", "The whole subject, head to toe, with some space around them."],
        ["Medium shot", "The subject from about the waist up. Good for conversation and for delivering facts."],
        ["Close-up", "Part of the subject fills the frame — for a person, the face. The shot for emotion."],
        ["Extreme close-up", "A detail only: the eyes and mouth, a hand, a key. Too close to read a whole reaction."]
      ]),
      D("Close-up", "A shot that fills the frame with part of the subject — for a person, usually the face — " +
        "drawing attention to emotion or detail."),
      P("Two more shots are defined by their job rather than their size. A <b>reaction shot</b> shows someone " +
        "responding to what just happened, usually in close-up. An <b>insert shot</b> shows part of the action " +
        "already covered in the master shot — a hand on a door handle, a letter being read — from a different " +
        "angle or distance, to emphasise it."),
      N("<b>A correction to the course text.</b> It says full shots “often use the 4×3 aspect ratio”. Shot size " +
        "and aspect ratio have nothing to do with each other: a full shot can be framed in 4:3, 16:9 or any " +
        "other shape."),
      H("Camera angles"),
      F({ imgs: [{ src: M + "7-3-camera-angles.svg", w: 700, h: 500,
                   alt: "Side view of a standing person with cameras at different heights aimed at their head: " +
                        "directly overhead for a bird's-eye view, above eye level for a high angle, at eye level, " +
                        "below eye level for a low angle, and on the ground for a ground shot. An inset shows a " +
                        "Dutch angle as a frame with a tilted horizon." }],
          cap: "The height of the camera, relative to the subject's eyes, changes how the subject feels. Look " +
               "down on someone and they seem smaller; look up and they loom.",
          credits: OEDU, diagram: true }),
      D("Low-angle shot", "A shot from below the subject, looking up, which makes the subject seem bigger, " +
        "stronger or more threatening. A camera on the ground gives the most extreme version, a ground shot."),
      P("A <b>high-angle shot</b> does the opposite: looking down from above, it can make a subject seem small " +
        "or vulnerable. Taken to its extreme — straight down — it becomes a <b>bird's-eye view</b>, which shows " +
        "a scene as a pattern or a map."),
      F({ imgs: [{ src: M + "7-3-worms-eye-skytree.jpg", w: 1000, h: 666,
                   alt: "Looking straight up at the Tokyo Skytree from its base: the white lattice tower rises into " +
                        "a blue sky, its steel legs converging toward the top of the frame." }],
          cap: "Tokyo Skytree from directly beneath — a ground-level, extreme low angle. The tower's lines rush " +
               "upward and converge, and the structure towers over the viewer.",
          credits: [{ by: "Basile Morin",
                      byUrl: commons("Worm's-eye_view_of_Tokyo_Skytree_with_vertical_symmetry_impression,_a_sunny_day,_in_Japan.jpg"),
                      site: "Wikimedia Commons",
                      siteUrl: commons("Worm's-eye_view_of_Tokyo_Skytree_with_vertical_symmetry_impression,_a_sunny_day,_in_Japan.jpg"),
                      license: "CC BY-SA 4.0", licenseUrl: BYSA4 }] }),
      D("Dutch angle", "A shot taken with the camera rolled sideways, so the horizon and upright lines slant. " +
        "Also called a Dutch tilt or oblique angle; used for unease, disorientation or tension."),
      F({ imgs: [{ src: M + "7-3-dutch-angle.jpg", w: 700, h: 1050,
                   alt: "A woman in a black coat leans against a stone column in an arcade, photographed with the " +
                        "camera tipped sideways so the columns and paving slant diagonally across the frame." }],
          cap: "A Dutch angle in a fashion photograph. Every column that should stand upright leans — the tilt " +
               "is felt before it is noticed.",
          credits: [{ by: "Tobias ToMar Maier",
                      byUrl: commons("Intentional_camera_tilt_or_Dutch_angle_-_example_in_fashion_photography_for_filling_the_frame_-_ModelTanja.jpg"),
                      site: "Wikimedia Commons",
                      siteUrl: commons("Intentional_camera_tilt_or_Dutch_angle_-_example_in_fashion_photography_for_filling_the_frame_-_ModelTanja.jpg"),
                      license: "CC BY-SA 3.0", licenseUrl: BYSA3 }], size: "medium" }),
      P("A <b>fisheye</b> view comes not from where the camera stands but from its lens: an ultra-wide lens that " +
        "takes in a huge field of view and bends every straight line that does not pass through the centre of " +
        "the frame into a curve."),
      F({ imgs: [{ src: M + "7-3-fisheye.jpg", w: 1000, h: 866,
                   alt: "A circular fisheye photograph of a flooded woodland: bare tree trunks bow outward around the " +
                        "edge of the circle, and their reflections curve in the water below." }],
          cap: "A fisheye lens on straight trees. Only the lines through the centre stay straight; the rest bow " +
               "outward, as if the scene were printed on a bubble.",
          credits: [{ by: "Jimmy Male", byUrl: commons("Swampy_fisheye_lens_(crop).jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Swampy_fisheye_lens_(crop).jpg"),
                      license: "CC BY-SA 3.0", licenseUrl: BYSA3 }] }),
      N("<b>A correction to the course text.</b> It calls the fisheye “a distorted version of the high-angle " +
        "shot”. A fisheye is a type of lens, not an angle, and it can be used from any height."),
      H("Moving with the subject"),
      D("Tracking shot", "A shot in which the camera travels alongside a moving subject, often mounted on a " +
        "wheeled dolly running on track like a small railway."),
      F({ imgs: [{ src: M + "7-3-dolly-track.jpg", w: 1200, h: 900,
                   alt: "A heavy grey camera dolly with a hydraulic column sits on a length of metal track laid on " +
                        "a floor, ready to carry a camera smoothly along the rails." }],
          cap: "A J.L. Fisher camera dolly on track. The camera mounts on top; the dolly grip pushes it along the " +
               "rails, so the camera glides beside the action instead of bumping over the floor.",
          credits: [{ by: "Eliot Lash", byUrl: commons("Fisher_dolly_on_track_wide.JPG"),
                      site: "Wikimedia Commons", siteUrl: commons("Fisher_dolly_on_track_wide.JPG"),
                      license: "CC BY 2.5", licenseUrl: BY25 }] }),
      H("The documentary style"),
      P("Documentaries have a grammar of their own. A <b>voiceover</b> from an unseen narrator explains the " +
        "images. <b>Time-lapse</b> compresses hours or days into seconds — a flower opening, a city's traffic. " +
        "And some documentaries, especially small ones, show their own making: the crew, the camera, the " +
        "interview being set up."),
      R([
        { by: "Joseph V. Mascelli", year: "1965", title: "The Five C's of Cinematography",
          pub: "Cine/Grafic Publications",
          note: "The classic account of camera angles, continuity and the line." },
        { by: "Steven D. Katz", year: "1991", title: "Film Directing Shot by Shot",
          pub: "Michael Wiese Productions",
          note: "Staging and coverage, drawn out shot by shot from above." }
      ])
    ],
    check: { q: "Which of the following shots is a frame where the camera is moving alongside the subject or " +
                "object as it moves?",
             opts: ["Dutch", "Bird's-eye", "Tracking", "High-angle"], right: 2,
             why: "A tracking shot. The others are about the camera's angle, not its movement." }
  }, {
    n: "7.4", t: "The Moving Camera", kicker: "Camera movement",
    stand: "Every camera move is one of two things: the camera turns where it stands, or the whole camera " +
           "travels. Knowing which is which is most of the vocabulary.",
    mins: 10,
    objectives: ["Identify the types of moving camera shots used in cinematography"],
    body: [
      F({ imgs: [{ src: M + "7-4-camera-moves.svg", w: 700, h: 560,
                   alt: "Two panels. Left, turn the camera: a camera with curved arrows for pan, turning left or " +
                        "right; tilt, pointing up or down; and roll, tipping sideways. Right, move the camera: a " +
                        "camera with straight arrows for dolly, toward or away; truck, sideways; pedestal, up or " +
                        "down; and an arc for crane. A note below says zoom is not a move, because nothing travels." }],
          cap: "The two families of camera movement. On the left the camera pivots in place; on the right it " +
               "travels through space. A zoom belongs to neither: nothing moves, the lens changes.",
          credits: OEDU, diagram: true }),
      H("Turning the camera"),
      D("Pan", "Turning the camera horizontally, left or right, from a fixed point. Short for panorama."),
      P("The pan is the simplest and most common move — and most often done too fast. A <b>whip pan</b> is " +
        "done too fast on purpose: the picture smears into streaks, and editors use it to jump between scenes " +
        "or to show time rushing forward."),
      N("<b>A correction to the course text.</b> It says a pan “can also be angled if it is following a subject " +
        "up a stairwell”. Pointing the camera up or down is a tilt; following someone up a staircase is a tilt, " +
        "or a pan and a tilt together."),
      D("Tilt", "Pointing the camera up or down from a fixed point, without raising or lowering it."),
      H("Moving the whole camera"),
      D("Dolly", "Moving the whole camera toward the subject (dolly in) or away from it (dolly out), usually on a " +
        "wheeled platform."),
      D("Truck", "Moving the whole camera sideways, parallel to the subject — the move a tracking shot uses."),
      D("Pedestal", "Raising (pedestal up) or lowering (pedestal down) the whole camera while it keeps pointing " +
        "the same way."),
      P("Pedestal and tilt are easy to confuse because both change what is seen above and below. The test is " +
        "the lens: in a tilt it swings up or down from the same spot; in a pedestal the whole camera rises or " +
        "sinks, and the lens stays level."),
      D("Crane shot", "A shot from a camera on a crane or jib arm, which can swing it high above the action or " +
        "sweep it down to the ground in one continuous move."),
      F({ imgs: [{ src: M + "7-4-camera-crane.jpg", w: 1200, h: 896,
                   alt: "A long black telescopic camera crane labelled MovieBird 45 on a wheeled base, its arm " +
                        "reaching across a dusty street on a Wild West film set with a wooden saloon behind." }],
          cap: "A telescopic camera crane on a western film set. The camera rides on the far end of the arm, " +
               "and the crew below can raise it, swing it and extend it during a single shot.",
          credits: [{ by: "Telescopic Camera Cranes (photo by Christian Hurley)",
                      byUrl: commons("Telescopic_Camera_Crane_MovieBird_45.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Telescopic_Camera_Crane_MovieBird_45.jpg"),
                      license: "CC BY-SA 3.0", licenseUrl: BYSA3 }] }),
      H("Zoom, and the dolly zoom"),
      D("Zoom", "Changing the focal length of the lens during a shot, so the subject is magnified or shown " +
        "wider. The camera does not move."),
      P("A zoom and a dolly can look alike, but they are not. Moving the camera changes perspective — nearby " +
        "things pass faster than distant ones. A zoom only enlarges or shrinks the picture, so everything grows " +
        "together, which is why an overused zoom looks flat."),
      D("Dolly zoom", "Moving the camera toward or away from the subject while zooming the opposite way, so the " +
        "subject stays the same size in the frame while the background seems to stretch away or swell up."),
      F({ imgs: [{ src: M + "7-4-dolly-zoom.svg", w: 700, h: 520,
                   alt: "Overhead diagram: a subject stands between a camera and distant mountains. A close camera " +
                        "with a wide lens takes in a wide slice of the background; a far camera zoomed in takes in a " +
                        "narrow slice. Beside it, two frames: at the start the person is small against small " +
                        "mountains; at the end the person is the same size, but the mountains fill the frame." }],
          cap: "Why the background swells. Both cameras frame the subject at the same width — but the far, " +
               "zoomed-in camera sees a much narrower slice of what lies behind, so that slice fills the frame.",
          credits: OEDU, diagram: true }),
      F({ imgs: [{ src: M + "7-4-dolly-zoom.gif", w: 581, h: 497,
                   alt: "Animation of a dolly zoom: in the top panel a figure stays the same size while the rows of " +
                        "background objects behind it shrink and grow; in the plan view below, the camera moves " +
                        "back and forth as its field of view narrows and widens." }],
          cap: "The same effect, moving. Watch the figure hold still while the world behind it breathes in and " +
               "out, and the camera, in the plan view below, travel to make it happen.",
          credits: [{ by: "Mike1024", byUrl: commons("Contra-zoom_aka_dolly_zoom_animation.gif"),
                      site: "Wikimedia Commons", siteUrl: commons("Contra-zoom_aka_dolly_zoom_animation.gif"),
                      license: "Public domain" }], natural: true, size: "medium" }),
      P("Alfred Hitchcock made the effect famous in <i>Vertigo</i> (1958), to put a man's fear of heights on the " +
        "screen; it is often called the <b>vertigo effect</b>."),
      H("Moving the focus"),
      D("Rack focus", "Shifting sharp focus within one shot from a subject at one distance to a subject at " +
        "another — say, from a tree in the foreground to mountains behind it."),
      F({ imgs: [{ src: M + "7-4-focus-puller.jpg", w: 1400, h: 934,
                   alt: "On a rooftop at sunset, a camera operator holds a large Panavision cinema camera on his " +
                        "shoulder while a crew member beside him turns a white focus wheel mounted on the side of " +
                        "the lens, with an actor out of focus in the background." }],
          cap: "A focus puller turns the follow-focus wheel on a Panavision camera while the operator frames the " +
               "shot. Keeping focus right as actors move is his whole job.",
          credits: [{ by: "Elio Yañez", byUrl: commons("Focus_puller_adjusts_the_focus_on_a_Panavision_camera.jpg"),
                      site: "Wikimedia Commons",
                      siteUrl: commons("Focus_puller_adjusts_the_focus_on_a_Panavision_camera.jpg"),
                      license: "CC BY 2.0", licenseUrl: BY2 }] }),
      N("<b>A correction to the course text.</b> It treats “focus pull” and “rack focus” as the same. Pulling " +
        "focus is the continuous work of keeping the right thing sharp all through a shot; a rack focus is one " +
        "deliberate, visible shift from one subject to another."),
      H("Smooth movement by hand"),
      D("Camera stabilizer", "A rig that isolates the camera from the operator's steps and shakes, so a " +
        "handheld moving shot stays smooth. The Steadicam is the best-known system."),
      P("Garrett Brown invented the Steadicam in the 1970s. Its first feature film was <i>Bound for Glory</i> " +
        "(1976), and the same year it followed Sylvester Stallone up the steps of the Philadelphia Museum of " +
        "Art in <i>Rocky</i> — Brown himself operated it."),
      F({ imgs: [{ src: M + "7-4-steadicam.jpg", w: 800, h: 1066,
                   alt: "An operator wearing a Steadicam vest stands in front of a crowd, the camera floating on a " +
                        "long sled at the end of a sprung metal arm attached to the vest." }],
          cap: "A Steadicam in use. The vest takes the weight, the sprung arm soaks up the operator's steps, and " +
               "the camera floats on a balanced sled at the end of it.",
          credits: [{ by: "Mike1024", byUrl: commons("Steadicam_and_operator_in_front_of_crowd.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Steadicam_and_operator_in_front_of_crowd.jpg"),
                      license: "Public domain" }], size: "medium" }),
      N("<b>A correction to the course text.</b> It says stabilizers are “a series of counterweights and " +
        "gyroscopes” and are “often used for business videos”. A Steadicam balances the camera on a sled with " +
        "counterweights, a gimbal and a sprung arm on a vest; gyroscopes are an optional extra. Its fame came " +
        "from feature films. Today's handheld gimbals do the same job with electric motors."),
      R([
        { by: "The Tiffen Company", title: "History of Steadicam", pub: "tiffen.com",
          url: "https://tiffen.com/pages/history-of-steadicam" },
        { by: "The Criterion Collection", title: "Smooth Talk: A Conversation with Steadicam Inventor Garrett Brown",
          pub: "The Current",
          url: "https://www.criterion.com/current/posts/4364-smooth-talk-a-conversation-with-steadicam-inventor-garrett-brown" },
        { by: "Blain Brown", year: "2016", title: "Cinematography: Theory and Practice", pub: "3rd ed., Routledge",
          note: "Camera movement, dollies, cranes and focus pulling, from the crew's side." }
      ])
    ],
    check: { q: "True or false: A rack focus shifts the focus from one subject to another within the same shot.",
             opts: ["True", "False"], right: 0,
             why: "True. The shot does not cut; only what is sharp changes, and the audience's attention moves " +
                  "with it." }
  }, {
    n: "7.5", t: "Framing a Good Shot", kicker: "Composition",
    stand: "A frame is a rectangle of decisions. What sits where, how much space surrounds it, and what is " +
           "left out entirely are chosen, not found.",
    mins: 7,
    objectives: ["Describe the use of the rule of thirds in cinematography",
                 "Describe subject framing and shot composition in cinematography"],
    body: [
      H("The rule of thirds"),
      D("Focal point", "The area of the frame that draws the viewer's eye first — usually the subject who is " +
        "speaking, or the most important part of the scene."),
      P("Videographers use the same grid photographers do: divide the frame into thirds across and thirds " +
        "down, and the four points where the lines cross make strong places for a focal point. A subject placed " +
        "there feels settled but alive; dead centre often feels static."),
      P("The grid also checks balance. Look at each third in turn: if one is crowded and the rest are empty, " +
        "move something, or move the camera, until the frame feels even."),
      F({ imgs: [{ src: "media/unit6/6-6-thirds-vs-golden.svg", w: 1100, h: 440,
                   alt: "Two frames side by side. Left: rule of thirds lines at 33 and 67 percent with four blue " +
                        "intersection points. Right: golden ratio lines at about 38 and 62 percent, with the thirds " +
                        "shown dashed for comparison." }],
          cap: "From Unit 6: the rule of thirds and the golden ratio are related but not the same. The golden " +
               "ratio's lines sit closer to the centre.",
          credits: OEDU, diagram: true }),
      N("<b>A correction to the course text.</b> As in 6.6, it says “the rule of thirds, or the Golden Ratio”, " +
        "as if they were one idea. Thirds divide the frame 1 : 1 : 1; the golden ratio is about 1 to 1.618. " +
        "Claims that the golden ratio is everywhere in nature are also often overstated."),
      H("Room in the frame"),
      F({ imgs: [{ src: M + "7-5-framing-room.svg", w: 700, h: 724,
                   alt: "Six frames in three rows, well framed on the left and badly framed on the right. Looking " +
                        "room: a person looking left on the right third with space in front of the face, versus a " +
                        "person at the left edge looking into it. Head room: a head with a small gap above and eyes " +
                        "near the top third line, versus a head sunk low under empty space. Lead room: a runner " +
                        "moving right on the left third with space ahead, versus a runner at the right edge." }],
          cap: "Three kinds of space, each done well (left) and badly (right). In every good frame the empty " +
               "space is where the subject is looking or going.",
          credits: OEDU, diagram: true }),
      D("Looking room", "Space left between a subject's face and the edge of the frame they are looking toward. " +
        "Also called nose room."),
      P("People on camera rarely look straight into the lens; in interviews and sitcoms they look just past it. " +
        "Give them more space on the side they are looking toward, and the frame feels open. Put them against " +
        "that edge and they seem to stare into a wall."),
      D("Lead room", "Space left in the frame ahead of a moving subject, in the direction it is moving."),
      D("Head room", "The space between the top of the subject's head and the top of the frame. Too much makes " +
        "them sink; too little crops them. The closer the shot, the less is needed."),
      H("What is left out"),
      P("Composition is as much about exclusion as inclusion. A stray sign, a bright window or a pole that " +
        "seems to grow out of someone's head pulls the eye away. Framing the environment carefully is part of " +
        "the shot."),
      D("Leading lines", "Lines in the frame — a road, a railing, ropes, the edge of a table — that guide the " +
        "viewer's eye toward the subject, or around the frame in the order the maker intends."),
      N("<b>A correction to the course text.</b> It says producers “make certain to create tangents”, lines " +
        "that connect subjects. In composition, a tangent is an awkward point where two edges just touch — a " +
        "horizon running exactly along someone's shoulder — and it is usually avoided. The lines the text " +
        "describes are leading lines."),
      R([
        { by: "Bruce Block", year: "2008", title: "The Visual Story", pub: "2nd ed., Focal Press",
          note: "How space, line and shape carry a story on screen." },
        { by: "Joseph V. Mascelli", year: "1965", title: "The Five C's of Cinematography",
          pub: "Cine/Grafic Publications", note: "The chapter on composition." }
      ])
    ],
    check: { q: "What is the space located in front of a moving subject, in the direction it is going, called?",
             opts: ["Lead room", "Tangent", "Head room", "Golden ratio"], right: 0,
             why: "Lead room — space for the subject to move into." }
  }, {
    n: "7.6", t: "Video Production Roles and Styles", kicker: "Who makes it",
    stand: "No video is made by one person, even when one person makes it. Every production needs someone " +
           "to plan it, shoot it, cut it and make it sound right.",
    mins: 9,
    objectives: ["List some of the roles and responsibilities in video production",
                 "List some of the types of video production"],
    body: [
      F({ imgs: [{ src: M + "7-6-production-roles.svg", w: 700, h: 450,
                   alt: "Three columns with arrows between them. Before, pre-production: producer, who plans, funds " +
                        "and hires, and writer. During, production: videographer, sound recordist, and people on " +
                        "camera such as anchors and reporters. After, post-production: video editor, sound editor, " +
                        "Foley artist and re-recording mixer." }],
          cap: "The jobs in a production, in the order the work happens. On a small shoot one person may wear " +
               "several of these hats; on a feature film each can be a whole department.",
          credits: OEDU, diagram: true }),
      H("Behind the camera"),
      D("Videographer", "The person who operates the camera and records a video production, typically on " +
        "smaller projects: weddings, events, documentaries, commercials and training videos."),
      P("On a feature film, the person in charge of the look of the images is the cinematographer, or director " +
        "of photography, who leads a camera and lighting crew. The line between the two titles is about the " +
        "scale of the production more than the length of what is made."),
      P("Some videographers work for one company, as corporate videographers, making videos for its business. " +
        "Others work freelance and choose their projects."),
      N("<b>A note on the course text.</b> It says freelancers “can copyright their work”. Everyone who makes " +
        "original work owns its copyright unless an agreement says otherwise. The real difference is that an " +
        "employee's work usually belongs to the employer, while a freelancer keeps it unless a contract " +
        "transfers it."),
      H("After the shoot"),
      D("Video editor", "Assembles and shapes the recorded footage into the finished piece, using editing " +
        "software. Common in film, television and broadcasting, and in companies' marketing teams."),
      D("Sound editor", "Selects, cleans and places the sound recordings — dialogue, effects, atmosphere — so " +
        "they fit the picture."),
      D("Foley", "Everyday sound effects performed and recorded in time with the picture in a studio: footsteps, " +
        "doors, clothing, a punch. Named after Jack Foley, who pioneered the craft at Universal."),
      F({ imgs: [{ src: M + "7-6-foley-room.jpg", w: 900, h: 1092,
                   alt: "In a studio lined with sound-absorbing panels, a young man wearing headphones drops a " +
                        "bowling ball onto a concrete floor next to a microphone on a stand, with pans and props " +
                        "nearby." }],
          cap: "A student Foley artist at the Vancouver Film School drops a bowling ball beside the microphone. " +
               "Much of what you hear in a film was performed like this, afterwards, in time with the picture.",
          credits: [{ by: "Vancouver Film School", byUrl: commons("Foley_Room_at_the_Sound_Design_Campus_(cropped).jpg"),
                      site: "Wikimedia Commons",
                      siteUrl: commons("Foley_Room_at_the_Sound_Design_Campus_(cropped).jpg"),
                      license: "CC BY 2.0", licenseUrl: BY2 }], size: "medium" }),
      N("<b>A correction to the course text.</b> It says the sound editor prepares “the final sound mixing” " +
        "and records sounds with objects. Performing sound effects is the Foley artist's work, and the final " +
        "mix — balancing dialogue, music and effects — belongs to the re-recording mixer."),
      H("The news"),
      D("Anchor", "The person who presents a news programme, introducing each story and reading from a " +
        "teleprompter. Reporters, or correspondents, gather the news in the field and conduct interviews."),
      D("Teleprompter", "A device that shows the script on angled glass directly in front of the camera lens, " +
        "so a presenter can read while looking straight into the lens."),
      F({ imgs: [{ src: M + "7-6-teleprompter-schematic.png", w: 1250, h: 650,
                   alt: "Diagram of a teleprompter, numbered: 1 a video camera on a tripod, 2 a dark hood over the " +
                        "lens, 3 a monitor lying flat beneath it, 4 angled glass inside the hood, 5 a red arrow " +
                        "showing the presenter's image passing through the glass to the camera, and 6 a blue arrow " +
                        "showing the text from the monitor reflecting off the glass to the presenter." },
                 { src: M + "7-6-teleprompter-autocue.jpg", w: 1200, h: 799,
                   alt: "A studio camera fitted with an Autocue teleprompter: a monitor lies flat beneath angled " +
                        "glass, and the script appears mirrored on the monitor and readable on the glass, with the " +
                        "camera lens visible through it." }],
          cols: 1,
          cap: "How it works (top): the monitor (3) lies flat, its text reflects off the angled glass (4) toward " +
               "the presenter (6), and the camera (1) looks straight through that same glass at them (5). The " +
               "hood (2) keeps light off the glass. Below, a real one: the script is back to front on the monitor " +
               "and reads correctly in the glass.",
          credits: [{ what: "Diagram", by: "grm_wnr, after Dhodges", byUrl: commons("Teleprompter_schematic.svg"),
                      site: "Wikimedia Commons", siteUrl: commons("Teleprompter_schematic.svg"),
                      license: "CC BY-SA 3.0", licenseUrl: BYSA3 },
                    { what: "Photo", by: "NJM2010", byUrl: commons("Autocue_teleprompter.jpg"),
                      site: "Wikimedia Commons", siteUrl: commons("Autocue_teleprompter.jpg"),
                      license: "CC BY-SA 3.0", licenseUrl: BYSA3 }] }),
      N("<b>A correction to the course text.</b> It says teleprompters are “always placed out of the camera's " +
        "frame”. The glass sits directly in front of the lens; the camera shoots through it, and the angle " +
        "keeps the text invisible to viewers. That is exactly why the anchor seems to look into your eyes."),
      H("Sport"),
      P("A <b>play-by-play announcer</b> describes the action as it happens, often as a voiceover during a live " +
        "broadcast. Beside them, an <b>analyst</b> or colour commentator adds expert background — statistics, " +
        "tactics, what the players are thinking — and many analysts are retired athletes of the sport."),
      H("Documentaries and interviews"),
      P("Documentaries come in many forms. Some are personal, following one life, sometimes back into a " +
        "family's ancestry. Others are informational, investigating a historical question, a scientific " +
        "puzzle or a current event. Many are built from <b>interviews</b>, in which an interviewee is questioned " +
        "on a topic — a form news and sport use too."),
      R([
        { by: "Vanessa Theme Ament", year: "2009",
          title: "The Foley Grail: The Art of Performing Sound for Film, Games, and Animation", pub: "Focal Press" },
        { by: "Blain Brown", year: "2016", title: "Cinematography: Theory and Practice", pub: "3rd ed., Routledge",
          note: "The camera department, role by role." }
      ])
    ],
    check: { q: "Where does a studio teleprompter put the script?",
             opts: ["On cue cards held beside the camera", "On angled glass directly in front of the lens",
                    "On a monitor on the floor the anchor looks down at", "In an earpiece"], right: 1,
             why: "On angled glass in front of the lens. The camera sees through the glass, and the presenter reads " +
                  "the reflection while looking straight into the lens." }
  }, {
    n: "7.7", t: "Transitions", kicker: "Joining shots",
    stand: "Every edit is a join between two shots, and every kind of join says something different — that " +
           "no time passed, that a day did, or that two things are secretly the same.",
    mins: 8,
    objectives: ["Identify the types of transitions used in video editing"],
    body: [
      F({ imgs: [{ src: M + "7-7-transitions.svg", w: 700, h: 700,
                   alt: "Six rows, each three frames in time order. Cut: beach, beach, then instantly a city at " +
                        "night. Dissolve: beach, a blend of beach and city, city. Wipe: beach, half city pushing in " +
                        "from the left, city. Match cut: a ball thrown into the sky, the ball high up, then the moon " +
                        "in the same spot. Jump cut: the same room framed identically at 0:00, 0:40 and 1:25, with " +
                        "the person in a different place each time. Cutaway: a person talking, a mountain, the " +
                        "person again." }],
          cap: "Six ways to get from one shot to the next, each drawn as three moments in order.",
          credits: OEDU, diagram: true }),
      H("Cuts"),
      D("Cut", "An instant change from one shot to the next, with no effect in between. The most common " +
        "transition by far — so common that audiences rarely notice it."),
      P("A cut keeps the story moving through different places without breaking its tension. Several kinds of " +
        "cut do more particular jobs."),
      D("Match cut", "A cut that links two different shots through a matching shape, movement or composition, " +
        "carrying the eye across the join and often across time or place."),
      P("The most famous is in Stanley Kubrick's <i>2001: A Space Odyssey</i> (1968): a prehistoric bone, thrown " +
        "spinning into the air, cuts to a spacecraft in orbit — millions of years crossed in one cut."),
      D("Jump cut", "A cut between two shots of the same subject taken from almost the same angle and framing, " +
        "so the subject seems to jump and time visibly skips."),
      P("Jean-Luc Godard's <i>Breathless</i> (1960) made jump cuts famous, and online video made them " +
        "everyday: a vlogger with the pauses cut out is a chain of jump cuts. Jump cuts draw attention to the " +
        "fact that the film has been edited, which is why they feel restless, funny or urgent."),
      N("<b>A correction to the course text.</b> It says a jump cut is taken “with cameras filming at slightly " +
        "different angles”. Its defining feature is a jump in time with the camera in almost the same place. " +
        "Editors avoid an accidental jump cut by changing the camera angle by at least 30 degrees between " +
        "shots — the 30-degree rule."),
      D("Cutaway", "A shot that interrupts the main action to show something else, then returns to it."),
      P("A cutaway can show what someone is describing, or what is happening elsewhere at the same moment. It " +
        "is also an editor's tool for hiding a jump: lay a cutaway over the join, and the viewer never sees " +
        "the interview skip."),
      D("Insert shot", "A shot of part of the scene — a detail of the action — from a different angle or " +
        "distance from the master shot, to emphasise it."),
      H("Transitions you can see"),
      D("Dissolve", "A transition in which one shot gradually fades out as the next fades in, overlapping for a " +
        "second or two. Also called a crossfade."),
      N("<b>A correction to the course text.</b> It calls a crossfade “a form of continuity editing”. A dissolve " +
        "usually does the opposite of hiding the join: it signals to the audience that time has passed or that " +
        "the scene has moved somewhere else."),
      D("Wipe", "A transition in which the new shot travels across the frame, pushing the old one off. It can " +
        "follow a straight edge or a shape, such as a circle or a heart."),
      P("Wipes are showy and slightly old-fashioned, which is why <i>Star Wars</i> uses so many: they recall " +
        "the adventure serials of the 1930s it was imitating."),
      H("Montage"),
      D("Montage", "Building meaning by selecting and joining separate shots, so the combination says more than " +
        "any single shot. A montage sequence compresses time into a short run of juxtaposed shots."),
      P("The word has two lives. For the Soviet filmmakers of the 1920s, montage was the whole theory of " +
        "editing: meaning is made by collision between shots. In Hollywood it means a sequence — the training " +
        "montage, the year passing in a minute — that tells a lot of story quickly."),
      R([
        { by: "Walter Murch", year: "2001", title: "In the Blink of an Eye", pub: "2nd ed., Silman-James Press",
          note: "Why cuts work at all, from the editor of Apocalypse Now." },
        { by: "Karel Reisz and Gavin Millar", year: "1968", title: "The Technique of Film Editing",
          pub: "2nd ed., Focal Press" }
      ])
    ],
    check: { q: "Which type of cut links together two scenes that visually resemble one another?",
             opts: ["Dissolve", "Cutaway", "Match", "Jump"], right: 2,
             why: "A match cut — the resemblance in shape, movement or composition is what carries the eye across." }
  }, {
    n: "7.8", t: "Becoming the Editor", kicker: "Editing software",
    stand: "Editing software gives an editor three things to decide before any cut: the shape of the frame, " +
           "how many frames make a second, and how the shots join.",
    mins: 7,
    objectives: ["Describe some of the basic aspects and terms of video editing"],
    body: [
      P("Learning an editing program takes practice, and there are more options than anyone uses. The way in " +
        "is to try each tool, see what it does, and decide when you would reach for it."),
      F({ imgs: [{ src: M + "7-8-kdenlive.png", w: 1600, h: 856,
                   alt: "The Kdenlive video editor: a project bin and effects list on the left, a preview monitor " +
                        "and audio mixer at the top, and a timeline across the bottom with two video tracks and two " +
                        "audio tracks under a time ruler." }],
          cap: "Kdenlive, a free, open-source editor. Nearly every non-linear editor has the same layout: your " +
               "clips on the left, a preview at the top, and the timeline — video tracks above, audio tracks " +
               "below — across the bottom. Enlarge it to read the panels.",
          credits: [{ by: "KDE, Kdenlive Project", byUrl: commons("Kdenlive_21.08.png"),
                      site: "Wikimedia Commons", siteUrl: commons("Kdenlive_21.08.png"),
                      license: "CC BY-SA 4.0", licenseUrl: BYSA4 }] }),
      L("What editing software lets you do", [
        ["Arrange", "Place clips on the timeline, and move them into any order."],
        ["Trim", "Shorten or lengthen a shot by moving its start or end."],
        ["Join", "Choose a transition between two clips — a cut, a dissolve, a wipe."],
        ["Sound", "Add music and effects, and set the volume of every track."],
        ["Export", "Render the finished timeline as a single video file."]
      ]),
      H("Aspect ratio"),
      D("Aspect ratio", "The proportion of a frame's width to its height, written as two numbers with a colon: " +
        "16:9 means 16 units wide for every 9 units high, whatever the units are."),
      F({ imgs: [{ src: M + "7-8-aspect-ratios.svg", w: 700, h: 480,
                   alt: "Five rectangles at the same height: 4:3 for older television, 16:9 for HD television and " +
                        "most screens, 9:16 for vertical video on a phone, 1.85:1 for widescreen cinema, and 2.39:1 " +
                        "for the widest common cinema format." }],
          cap: "Five aspect ratios at the same height. The shape is decided before shooting, because it decides " +
               "what can fit in a frame — a vertical phone video and a cinema screen compose the same scene " +
               "completely differently.",
          credits: OEDU, diagram: true }),
      H("Frame rate"),
      D("Frame rate", "The number of still frames shown each second, measured in frames per second (fps). Also " +
        "called frame frequency."),
      F({ imgs: [{ src: M + "7-8-frame-rates.svg", w: 700, h: 320,
                   alt: "One second of video drawn three times at the same length: 24 blue frames at 24 fps for " +
                        "film, 30 green frames at 30 fps for US television, and 60 thin orange frames at 60 fps " +
                        "for sports and games." }],
          cap: "One second, three frame rates. Film has run at 24 frames a second since sound arrived in the late " +
               "1920s; American television at about 30; sport and games often at 60.",
          credits: OEDU, diagram: true }),
      P("Shooting at one rate and playing at another changes speed. Footage shot at 60 frames a second and " +
        "played back at 30 runs at half speed, which is how slow motion is made."),
      N("<b>A correction to the course text.</b> It says video works because the brain “can only identify a " +
        "certain number of individual images” until “the images begin to blur together”. That old explanation, " +
        "persistence of vision, is a myth. The brain perceives motion from the differences between one frame " +
        "and the next — apparent motion — not from pictures lingering or blurring in the eye."),
      H("Cuts, continuous and not"),
      P("Once the footage is shot, cuts are how the editor tells the story. Some keep time running smoothly; " +
        "others make it jump — and knowing which is which is most of the craft."),
      L("Which way each one works", [
        ["Match cut", "Continuous. A shared shape or movement carries the eye across."],
        ["Jump cut", "Discontinuous. The same framing, with time cut out."],
        ["Cutaway", "Discontinuous. It leaves the main action for something else."],
        ["Dissolve", "Gradual. It usually marks time passing or a change of place."],
        ["Wipe", "Visible. One shot travels across and replaces the other."]
      ]),
      N("<b>Two changes to the course text.</b> A side note about jump cuts appears next to the section on " +
        "aspect ratios, where it does not belong, and cuts are described as “special effects”. A cut is the " +
        "absence of an effect. Both are left out here."),
      R([
        { by: "Joseph Anderson and Barbara Anderson", year: "1993",
          title: "The Myth of Persistence of Vision Revisited", pub: "Journal of Film and Video 45 (1), 3–12",
          url: "https://eric.ed.gov/?id=EJ477391" },
        { by: "Walter Murch", year: "2001", title: "In the Blink of an Eye", pub: "2nd ed., Silman-James Press" }
      ])
    ],
    check: { q: "True or false: Cutaway shots are not discontinuous.",
             opts: ["True", "False"], right: 1,
             why: "False. A cutaway interrupts the main action to show something else, so it is discontinuous." }
  }];
})();
