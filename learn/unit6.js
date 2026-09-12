/* ==========================================================================
   Media Arts — Unit 6, Intro to Photography. Sections 6.1 to 6.9.

   Written from the EHS course text, in the same way as Unit 5: curated
   rather than copied. Every definition a section tests on is here, every
   number is here, and the padding around them is not.

   ------------------------------------------------------------ Corrections

   The source text is wrong in several places, and a study app that teaches a
   student something false is worse than one that teaches them nothing. Each
   correction below is marked in the reader with a note rather than silently
   rewritten, so a teacher comparing against the textbook can see what changed
   and why.

     6.1  It says "SLR, or digital cameras" capture images without film. SLR
          means single-lens reflex, and SLRs are very often film cameras; the
          digital version is a DSLR. The same paragraph then describes the
          SLR's pentaprism, which is the film design.
     6.1  "Film cameras produce negative images." Most do. Slide, or reversal,
          film produces a positive directly.
     6.2  "Lenses focus light … unlike a prism which refracts light." Lenses
          refract too; the difference is purpose, not mechanism.
     6.2  The ring positions contradict themselves (the aperture ring is both
          "farther towards the end" and "the first ring on the body"). They
          vary by lens, so the reader teaches them by function.
     6.2  "The CCD image sensor still offers superior image quality." That was
          true of early digital cameras. CMOS is now the dominant sensor and
          has overtaken CCD for most purposes.
     6.4  "When designers originally upload a file … it is in its raw
          format." Only if the camera was set to shoot raw. Most default to
          JPEG.
     6.4  GIF's licensing problems are historical: the patent expired in the
          early 2000s.
     6.5  Large-format cameras are described as belonging to "the 1930s
          through the 1950s". They are still made and used; Adams used them
          throughout his career.
     6.6  "The rule of thirds, or the golden ratio" treats them as one idea.
          They are related and different: equal thirds against roughly 1 to
          1.618. The source's definition of the golden ratio is also garbled,
          and is replaced with the standard one.
     6.7  "Saving images in the highest resolution possible, often TIFF
          files." TIFF is a lossless format, not a resolution. It preserves
          the pixels a file has; nothing adds ones it does not.

   ------------------------------------------------------------------ Checks

   6.2, 6.3, 6.5, 6.6, 6.7 and 6.9 use the course's own Check Your
   Understanding questions. 6.1, 6.4 and 6.8 had interactive exercises in the
   course rather than a written check, so their checks here are new, and
   written against the section's own text.

   ------------------------------------------------------------------ Video

   The course has a video for each section. None is wired up, because the
   files are not in this repository and a video frame that promises a lesson
   and then plays nothing is exactly the kind of feature this app does not
   ship. To add one, put the file in learn/media/ and give that section a
   `video:` line, the same as 5.1. The reader probes for the file first and
   only shows a player once it is really there.
   ========================================================================== */
window.OPLO_UNIT6 = (function () {
  "use strict";

  var P = function (t) { return { k: "p", t: t }; };
  var H = function (t) { return { k: "h", t: t }; };
  var D = function (t, d) { return { k: "def", t: t, d: d }; };
  var Q = function (t, s) { return { k: "quote", t: t, s: s }; };
  var N = function (t) { return { k: "note", t: t }; };
  var L = function (t, items) { return { k: "list", t: t, items: items }; };
  // A figure: images with real dimensions and alt text, a caption, and the
  // credit its licence asks for. See figureBlock in app.js.
  var F = function (o) {
    return { k: "fig", imgs: o.imgs, cap: o.cap, credits: o.credits,
             diagram: !!o.diagram, size: o.size || null };
  };

  return [{
    n: "6.1", t: "Early Cameras", kicker: "How a camera sees",
    stand: "A light-proof box that lets in exactly the right light at exactly the right " +
           "moment. Film or digital, every camera is that — and everything else is detail.",
    mins: 8,
    objectives: ["Briefly summarise how film cameras work",
                 "Differentiate between film and digital cameras",
                 "Recognise and describe important terms in photography such as aperture and " +
                 "shutter speed"],
    body: [
      H("A box that controls light"),
      P("Every camera, film or digital, is a light-proof box of plastic or metal that lets in a " +
        "measured amount of light at a chosen moment. In a film camera that light causes a " +
        "chemical reaction on photographic film, and the reaction is the photograph. A digital " +
        "camera records the same light on a sensor, as numbers, with no film at all."),
      P("Cameras are now built into almost every phone, yet many photographers still choose " +
        "older kinds of camera for the effects only they produce."),
      H("The path of the light"),
      P("In a single-lens reflex camera, light reflects off the subject, enters through the " +
        "lens and strikes an internal mirror. The mirror bounces it up into a five-sided block " +
        "of glass, the pentaprism, which turns it toward the eyepiece — a set of lenses in the " +
        "viewfinder — and into the photographer's eye. That is why an SLR shows the picture " +
        "exactly as the film will receive it."),
      D("Pentaprism", "A five-sided block of glass that turns the image from the mirror so it " +
        "reaches the eyepiece the right way up and the right way round. Still used in the " +
        "viewfinders of SLR and DSLR cameras."),
      L("When the shutter is pressed", [
        ["The mirror flips up", "Clearing the path from the lens to the back of the camera."],
        ["The shutter opens", "Light reaches the film — or, in a digital camera, the sensor."],
        ["The mirror drops back", "And the viewfinder shows the scene again."]
      ]),
      N("<b>A correction to the course text.</b> “SLR” means single-lens reflex — the " +
        "mirror-and-prism design above — and SLRs are very often film cameras. The digital " +
        "version is a DSLR. Some texts use the two words as if they meant the same thing; they " +
        "do not."),
      H("What the film is doing"),
      D("Photographic film", "A thin plastic sheet coated with tiny silver crystals held in " +
        "gelatin. Where light strikes, the crystals react and leave a precise, invisible record " +
        "of the scene."),
      H("Developing"),
      P("The image on exposed film cannot be seen until it is developed, in a darkroom, through " +
        "a series of chemical baths. The first chemical, the one that makes the image visible, " +
        "is called the developer."),
      D("Negative", "The developed film image, in which light and dark are reversed: bright " +
        "parts of the scene appear dark, and dark parts appear light."),
      P("To make a print, light is shone through the negative onto photosensitive paper. The " +
        "paper records the opposite of the negative — a positive print, with the tones the " +
        "right way round again."),
      Q("Reversed twice.", "The negative reverses the scene; the print reverses the negative. " +
        "Two reversals give back what the photographer saw."),
      N("Most everyday film is negative film, which is what this section describes. Slide, or " +
        "reversal, film produces a positive image directly."),
      H("Film and digital"),
      P("Digital cameras skipped the darkroom entirely, which is why photography became so fast " +
        "and so widespread. Film has not disappeared: many photographers prefer its look, it is " +
        "still taught at every level of education, and scanners now turn film, drawings and old " +
        "documents into digital files — to preserve them, and to edit them."),
      H("Aperture"),
      D("Aperture", "The opening in the lens that light passes through. Its size is controlled by " +
        "the diaphragm, which blocks all light except what goes through the opening."),
      D("F-stop", "The number used to express aperture size, written like f/5.6. A smaller " +
        "f-number means a larger opening; a larger f-number means a smaller one."),
      Q("Small number, big hole.", "It runs backwards, and it is the fact about aperture " +
        "students most often reverse."),
      D("Depth of field", "How much of the scene, from near to far, appears sharp. Aperture " +
        "controls it."),
      L("What the f-stop does to depth", [
        ["Larger f-stop", "A smaller aperture. Foreground and background both in focus."],
        ["Smaller f-stop", "A larger aperture. The subject sharp and the background blurred."]
      ]),
      H("Shutter speed"),
      D("Shutter", "The curtain in front of the film or sensor. It stays closed until the camera " +
        "fires, opens to expose it to the light coming through the aperture, and closes again."),
      D("Shutter speed", "How long the shutter stays open."),
      P("In dim light the shutter stays open longer to gather enough light; in bright light it can " +
        "be extremely quick. Speed is also a creative choice. A fast shutter freezes motion, and " +
        "a slow one lets movement blur — which is why car and motorbike advertisements so often " +
        "show sharp bodywork over blurred, spinning wheels.")
    ],
    check: { q: "A photographer wants a portrait with a sharp face and a softly blurred " +
                "background. Which setting helps most?",
             opts: ["A larger f-stop, like f/16", "A smaller f-stop, like f/2.8",
                    "A slower shutter speed", "Turning off the flash"],
             right: 1,
             why: "A smaller f-number means a larger aperture, which gives a shallow depth of " +
                  "field — the face sharp and the background soft." }
  }, {
    n: "6.2", t: "Components of a Camera Lens", kicker: "The lens",
    stand: "The body decides when light gets in. The lens decides what that light becomes — and " +
           "each kind of lens exists because it does one job better than the others.",
    mins: 7,
    objectives: ["Identify major parts of the camera lens",
                 "Describe the different camera lens styles and their usage"],
    body: [
      H("What a lens is"),
      D("Lens", "An optical device, usually polished glass, that bends light by refraction to " +
        "bring it into focus and form an image."),
      P("A simple lens is one piece of material. A compound lens is several simple lenses — " +
        "called elements — lined up along a common axis. Camera lenses are compound, and many of " +
        "their parts were designed with the human eye in mind."),
      N("<b>A correction to the course text.</b> A prism refracts light too. The difference is " +
        "purpose: a lens bends light to form an image, while a prism bends it to redirect it or " +
        "split it into colours."),
      H("The parts of a lens"),
      L("What each part does", [
        ["Filter thread", "The threaded ring inside the front of the lens, also called the filter " +
                          "ring, where filters and lens hoods screw on."],
        ["Focus ring", "Turned by hand to bring the subject into focus."],
        ["Zoom ring", "On lenses that zoom, changes the focal length — closer, or wider."],
        ["Aperture ring", "Linked to the diaphragm, so turning it opens or closes the aperture."],
        ["Lens mount", "The mechanical and electrical connection between lens and body. Only " +
                       "cameras with interchangeable lenses have one."]
      ]),
      N("<b>A correction to the course text.</b> Where each ring sits varies from lens to lens, " +
        "so learn the rings by what they do. Many modern lenses have no aperture ring at all; the " +
        "aperture is set from the camera body."),
      D("Focal length", "How strongly the lens magnifies, measured in millimetres. A shorter focal " +
        "length takes in a wider view; a longer one gives a narrower, more magnified view."),
      H("The sensor"),
      D("Image sensor", "The chip in a digital camera that records light in place of film. The two " +
        "main types are the CCD, or charge-coupled device, and the CMOS, or complementary " +
        "metal-oxide-semiconductor."),
      N("<b>A correction to the course text.</b> The CCD is the older technology, and was long " +
        "considered better for image quality. The CMOS is now used in almost every digital camera " +
        "and has overtaken it for most purposes."),
      H("Choosing a lens"),
      P("Point-and-shoot cameras have a fixed lens and handle most everyday pictures. Photographers " +
        "who specialise buy lenses for the job."),
      D("Wide-angle lens", "A lens with a focal length shorter than about 35mm, taking in a view " +
        "wider than about 55 degrees. The landscape photographer's lens."),
      D("Telephoto lens", "A lens with a longer focal length than standard, giving a narrow, " +
        "magnified view. It throws backgrounds out of focus and changes the perspective of the " +
        "picture, which is why it is used for headshots."),
      N("A telephoto lens does not move anybody closer. It magnifies — and the subject never has " +
        "to know the photographer is there."),
      D("Candid photograph", "A photograph of a person who does not know it is being taken. A " +
        "telephoto lens suits it: the person stays sharp while the background blurs away."),
      D("Macro lens", "A lens that focuses very close, so a small object fills the frame. A true " +
        "macro lens reaches a one-to-one ratio — the object recorded life-size."),
      L("Two ways to handle focal length", [
        ["Zoom lens", "A range of focal lengths, moving smoothly from a long shot to a close-up. " +
                      "Sometimes used for close work when there is no macro lens."],
        ["Prime lens", "One fixed focal length. To change the framing, the photographer moves."]
      ])
    ],
    check: { q: "What kind of lens would photographers use to capture landscape images?",
             opts: ["Telephoto", "Zoom", "Macro", "Wide-angle"], right: 3,
             why: "A wide-angle lens takes in a broader view than the eye does — exactly what a " +
                  "landscape needs." }
  }, {
    n: "6.3", t: "Colour Temperatures", kicker: "Colour",
    stand: "Warm colours come toward you and cool colours back away. Knowing which is which is " +
           "half of how a photograph makes somebody feel.",
    mins: 5,
    objectives: ["Differentiate between warm colours and cool colours",
                 "Define colour balance and explain how photographers use colour balance"],
    body: [
      P("Finding the shot is only part of photography. Colour shapes the emotion and the whole " +
        "composition of a picture, and editing software can adjust or add colour to create an " +
        "effect. However it is used, colour affects every photograph."),
      H("Warm and cool"),
      D("Warm colours", "Reds, oranges and yellows — the colours of sunlight and heat. They seem " +
        "to advance toward the viewer and take up more room."),
      D("Cool colours", "Blues, greens and light purples — the colours of water and sky. They seem " +
        "to recede, and tend to calm a design."),
      F({ imgs: [{ src: "media/unit6/6-3-warm-dunes.jpg", w: 800, h: 533,
                   alt: "Close-up of rippled sand dunes lit by a low sun, glowing deep orange and red " +
                        "between black shadows." },
                 { src: "media/unit6/6-3-cool-mountains.jpg", w: 800, h: 400,
                   alt: "Jagged mountain peaks rising above a sea of cloud before sunrise, under a pale " +
                        "blue sky with a faint pink glow along the horizon." }],
          cap: "Warm and cool. The orange dunes seem close enough to touch; the blue peaks sit far back " +
               "behind the cloud.",
          credits: [{ what: "Dunes", by: "Edwin Rodriguez", byUrl: "https://unsplash.com/@ed_757",
                      site: "Unsplash",
                      siteUrl: "https://unsplash.com/photos/rippled-sand-dunes-illuminated-by-warm-sunset-light-DS6lRtglcOM",
                      license: "Unsplash License", licenseUrl: "https://unsplash.com/license" },
                    { what: "Mountains", by: "Felix Bacher", byUrl: "https://unsplash.com/@bacherfelix",
                      site: "Unsplash", siteUrl: "https://unsplash.com/photos/mountains-during-blue-hour-FkSHP7t8mCg",
                      license: "Unsplash License", licenseUrl: "https://unsplash.com/license" }] }),
      P("That difference is practical. Interior designers use warm colours to make large rooms " +
        "feel cosier, because warm colours seem to bring the walls in."),
      N("On a colour wheel, the warm colours sit together on one side and the cool colours on the " +
        "other."),
      F({ imgs: [{ src: "media/unit6/6-3-colour-wheel.png", w: 960, h: 960,
                   alt: "A twelve-segment colour wheel divided by a diagonal line. The yellows, oranges " +
                        "and reds on one side are marked as warm colours; the greens, blues and purples " +
                        "on the other side are marked as cool colours." }],
          cap: "The warm half and the cool half of a colour wheel.",
          credits: [{ by: "Maulucioni, Guypeter4 and Sakurambo",
                      byUrl: "https://commons.wikimedia.org/wiki/File:Warm_and_cool_colors.svg",
                      site: "Wikimedia Commons",
                      siteUrl: "https://commons.wikimedia.org/wiki/File:Warm_and_cool_colors.svg",
                      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" }],
          diagram: true, size: "small" }),
      P("Most images lean warm or cool, but many of the most successful ones mix the two — and a " +
        "well-composed mix is often the most appealing to the eye."),
      F({ imgs: [{ src: "media/unit6/6-3-warm-and-cool-seashore.jpg", w: 1400, h: 931,
                   alt: "A beach at sunset. On the left the low sun, the clouds and the wet sand glow " +
                        "orange and pink; on the right the sea is a clear turquoise blue." }],
          cap: "Warm and cool in one frame: the sun and the sand come forward, and the turquoise water " +
               "settles back.",
          credits: [{ by: "Sean Oulashin", byUrl: "https://unsplash.com/@oulashin",
                      site: "Unsplash", siteUrl: "https://unsplash.com/photos/seashore-during-golden-hour-KMn4VEeEPR8",
                      license: "Unsplash License", licenseUrl: "https://unsplash.com/license" }] }),
      H("Colour balance"),
      D("Colour balance", "Adjusting the intensity of the colours in an image, usually the " +
        "primaries, so that particular colours — especially neutrals — look right. Called grey " +
        "balance for black-and-white images, and also known as white balance."),
      F({ imgs: [{ src: "media/unit6/6-3-kelvin-scale.png", w: 1920, h: 492,
                   alt: "A horizontal colour scale labelled from 1,000 to 12,000 kelvin. It runs from " +
                        "red and orange at the low end, through white around 6,500, to pale blue at the " +
                        "high end." }],
          cap: "Light has a colour temperature, measured in kelvin. A flame or an old bulb sits at the " +
               "warm, low end; overcast daylight and shade sit at the cool, high end — the numbers run " +
               "the opposite way to the feeling. White balance is how a camera, or an editor, corrects " +
               "for where the light sat.",
          credits: [{ by: "Bhutajata",
                      byUrl: "https://commons.wikimedia.org/wiki/File:Color_temperature_black_body_800-12200K.svg",
                      site: "Wikimedia Commons",
                      siteUrl: "https://commons.wikimedia.org/wiki/File:Color_temperature_black_body_800-12200K.svg",
                      license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" }],
          diagram: true }),
      P("Neutral colours often come out tinted in a photograph, and need a little red, blue or " +
        "yellow added or taken away to look neutral again. Editing software does it by changing " +
        "the red, green and blue values of the pixels."),
      F({ imgs: [{ src: "media/unit6/6-3-white-balance-lily.jpg", w: 801, h: 600,
                   alt: "The same photograph of a white, spotted lily shown twice side by side. The left " +
                        "version, straight from the camera, is brighter with cold whites; the right " +
                        "version, after colour balancing, is darker and warmer overall." }],
          cap: "As shot (left) and colour-balanced (right). The right-hand version was adjusted until a " +
               "grey surface photographed in the same light came out grey — so it is closer to how the " +
               "lily actually looked.",
          credits: [{ by: "Fg2", byUrl: "https://commons.wikimedia.org/wiki/File:Lily-M7292-As-shot-and-manual.jpg",
                      site: "Wikimedia Commons",
                      siteUrl: "https://commons.wikimedia.org/wiki/File:Lily-M7292-As-shot-and-manual.jpg",
                      license: "Public domain" }] }),
      Q("Correct, or deliberate.", "Sometimes colour balance makes neutrals neutral. Sometimes it " +
        "is pushed warmer or cooler on purpose. It depends on how the photographer wants the image " +
        "to feel.")
    ],
    check: { q: "Colour balance is often referred to as grey balance when referring to " +
                "black-and-white images.",
             opts: ["True", "False"], right: 0,
             why: "True. In a black-and-white image the adjustment is about neutral greys, so it " +
                  "goes by grey balance — and sometimes by white balance." }
  }, {
    n: "6.4", t: "The Default Formats of Cameras", kicker: "Files",
    stand: "Every photograph is saved as a trade between quality and size. Knowing which format " +
           "makes which trade is the difference between a file you can edit and one you can only " +
           "look at.",
    mins: 7,
    objectives: ["Recall the difference between raw and native file formats",
                 "Recall common image file formats"],
    body: [
      P("Sharing platforms accept particular file types and sizes, so a camera has to save images " +
        "in a form that can be shared. Most cameras have a default mode made for exactly that."),
      H("Lossy and lossless"),
      D("Lossy compression", "Compression that throws some data away permanently to make the file " +
        "smaller. Also called irreversible compression. The quality lost does not come back."),
      D("Lossless compression", "Compression that makes a file smaller without losing anything — " +
        "every bit of the original is restored when it is opened. Also called reversible " +
        "compression."),
      P("Lossy is used to make files small enough to store, share and send. Lossless is used " +
        "wherever nothing may be lost, which is why it is required for important text and data, " +
        "such as bank records."),
      H("Native, raw, and finished"),
      D("Native format", "The file format of the program a piece is being edited in. Save in it " +
        "whenever the work is not finished, so nothing is flattened or lost."),
      P("A finished piece is saved differently: in a format that keeps the resolution it needs " +
        "and suits where it is going."),
      D("Raw", "The unprocessed data straight from the sensor, with the metadata about how it was " +
        "captured. Often called a digital negative: not directly usable, but holding everything " +
        "needed to make the image."),
      D("Metadata", "Information stored with an image about the conditions it was captured in — " +
        "including the light intensity and the colour of the scene."),
      N("<b>A correction to the course text.</b> Only a camera set to shoot raw produces raw " +
        "files. Most cameras' default setting is JPEG, which is already processed and compressed."),
      H("Three sharing formats"),
      D("JPEG", "The most common format for sharing photographs, named for the Joint Photographic " +
        "Experts Group that wrote the standard. Lossy: the image is compressed into a small stream " +
        "of bytes, and quality is reduced when it is saved. It does not keep layers."),
      D("Byte", "A unit of memory: a group of eight bits that operate as one unit."),
      D("GIF", "Graphics Interchange Format, a bitmap format introduced by CompuServe in 1987. " +
        "Limited to a palette of 256 colours, which makes it poor for photographs but good for " +
        "logos and flat-colour graphics — and it supports animation. Saving compresses it " +
        "without degrading it."),
      D("PNG", "Portable Network Graphics. Developed by an internet committee as a patent-free " +
        "replacement for GIF. Lossless, and often 10 to 30 percent smaller than the same image " +
        "saved as a GIF."),
      N("GIF's licensing problems were historical. The patent it relied on expired in the early " +
        "2000s; PNG was designed so that the problem could never arise.")
    ],
    check: { q: "A designer has finished a logo with large areas of flat colour and needs a small " +
                "file that loses no quality. Which format fits best?",
             opts: ["JPEG", "PNG", "Raw", "The native format"], right: 1,
             why: "PNG is lossless and handles flat colour well. JPEG would lose quality, raw is " +
                  "not a finished format, and the native format is for work still being edited." }
  }, {
    n: "6.5", t: "Writing About a Photographer", kicker: "Ansel Adams",
    stand: "To understand a photographer's work, study the life behind it. What someone was " +
           "taught to care about is often what they spend a career pointing a camera at.",
    mins: 5,
    objectives: ["Explain why researchers study a photographer's upbringing",
                 "Summarise the background and work of Ansel Adams"],
    body: [
      H("Why the upbringing matters"),
      P("Researching a photographer means more than studying their pictures. Researchers collect " +
        "their background too, because the way someone was raised so often shapes the way they " +
        "see the world through a lens."),
      H("Ansel Adams"),
      P("One of the most influential fine-art photographers of the twentieth century, Ansel " +
        "Adams is best known for his photographs of Yosemite and Yellowstone National Parks. His " +
        "work showed the public the beauty of the Sierra Nevada — people who might never travel " +
        "there themselves — and helped build political support for protecting it."),
      P("He was a photographer and an environmentalist, and for him those were not two separate " +
        "jobs."),
      N("Adams was born in San Francisco, California, in 1902. His father's family had been New " +
        "Englanders since the eighteenth century."),
      H("The Zone System"),
      D("Zone System", "A technique Adams developed for choosing the right exposure and " +
        "controlling the contrast of the final print, so the photographer decides in advance how " +
        "each tone in the scene will appear."),
      P("It was first worked out for black-and-white prints, and it is the reason for the clarity " +
        "and depth his photographs are known for."),
      D("Large-format camera", "A camera that records on large sheets of film, giving very high " +
        "resolution and sharpness. Adams used them throughout his career."),
      N("<b>A correction to the course text.</b> Large-format cameras are not a thing of the 1930s " +
        "to the 1950s; they are still made and used today."),
      H("Where it started"),
      P("As a boy, Adams shared amateur astronomy with his father, who bought a three-inch " +
        "telescope. His father raised him to live modestly and morally, with a sense of social " +
        "responsibility toward nature — a principle Adams followed through his whole career."),
      Q("The photographs were the argument.", "Adams' pictures made people care about places " +
        "they had never seen, and caring is what protected them.")
    ],
    check: { q: "Ansel Adams enjoyed using large-format cameras.",
             opts: ["True", "False"], right: 0,
             why: "True. Large-format cameras gave him the resolution and sharpness his landscapes " +
                  "are known for." }
  }, {
    n: "6.6", t: "Rule of Thirds", kicker: "Composition",
    stand: "Where you put the subject decides where the eye goes first. Composition has rules, and " +
           "the first of them is knowing when to break one.",
    mins: 7,
    objectives: ["Describe the rule of thirds and how photographers apply it"],
    body: [
      H("The focal point"),
      D("Focal point", "The area of a photograph that draws the eye first. The most important " +
        "subject belongs there, because it is the viewer's first impression of the image."),
      H("The rule of thirds"),
      D("Rule of thirds", "Dividing the frame into thirds horizontally and vertically, so two " +
        "lines each way make a grid of nine. The four points where the lines cross are the " +
        "strongest places to put a subject."),
      P("The grid is also a way to check balance. Look at each third across and each third down: " +
        "if one holds far more than the others, move something — or find a different angle."),
      H("The golden ratio"),
      D("Golden ratio", "A proportion of about 1 to 1.618. Two lengths are in the golden ratio " +
        "when the larger divided by the smaller equals their sum divided by the larger. It " +
        "appears throughout nature, and art uses it as a proportion people tend to find " +
        "harmonious."),
      N("<b>A correction to the course text.</b> The rule of thirds and the golden ratio are " +
        "related, but they are not the same thing. The rule of thirds divides the frame into " +
        "equal thirds, with lines at 33 and 67 percent. The golden ratio divides it at about 38 " +
        "and 62 percent. The rule of thirds is best thought of as a simpler approximation of the " +
        "golden ratio."),
      Q("Mathematics and art share a vocabulary.", "The golden ratio is one of the places where " +
        "that is easiest to see."),
      H("Breaking the rule"),
      P("The rule of thirds can be broken on purpose. A strongly symmetrical scene holds its " +
        "balance through symmetry instead: every part of the grid carries equal weight, and there " +
        "is no single focal point to place."),
      H("Other elements"),
      D("Depth", "The sense of distance into a photograph, built from perspective and layering. " +
        "Many consider it the most important element of photography."),
      L("Three planes", [
        ["Foreground", "What is closest to the viewer."],
        ["Mid-ground", "What lies between — the plane that does most to create depth, and the one " +
                       "most often forgotten."],
        ["Background", "What is farthest away."]
      ]),
      D("Gestalt", "An organised whole that is perceived as more than the sum of its parts. " +
        "Originally a theory in psychology about how the mind makes meaning out of a chaotic " +
        "world."),
      P("A photograph can feel different from any of its parts, but the parts still build that " +
        "whole. A photograph is a single frozen moment and still full of movement — contrast, " +
        "value and colour working together to put emphasis on the focal point.")
    ],
    check: { q: "The rule of thirds is used to determine where a viewer's eyes tend to be " +
                "attracted to the most.",
             opts: ["True", "False"], right: 0,
             why: "True. The points where the grid lines cross are where the eye tends to go, " +
                  "which is why they are the strongest places for a subject." }
  }, {
    n: "6.7", t: "Basic Photo Editing", kicker: "Crop, size, export",
    stand: "Decide what a photograph is for before touching it. Cropping, sizing and exporting all " +
           "depend on the answer.",
    mins: 5,
    objectives: ["Describe best practices for cropping, resizing, and exporting photos"],
    body: [
      H("Cropping"),
      D("Cropping", "Removing the outer parts of an image to improve its framing, emphasise the " +
        "subject, or change the aspect ratio. Done to prints by hand, or digitally in editing " +
        "software."),
      P("It is one of the most basic edits there is, used across film, photography, design and " +
        "printing. Cutting unwanted space, subjects or detail usually strengthens the composition, " +
        "and cropping in on the subject can narrow the view when the lens could not zoom in far " +
        "enough."),
      N("To make a panoramic image, crop away the top and bottom of a wide shot."),
      D("Aspect ratio", "The proportion of an image's width to its height. Editing software offers " +
        "preset ratios, so a photo can be cropped to fit a particular frame."),
      H("Size and resolution"),
      P("Making an image smaller is easy. Making it larger again is hard, because shrinking throws " +
        "pixel data away and a computer cannot invent the pixels that were lost."),
      D("Resolution", "How much pixel detail an image holds. The more pixels, the larger it can be " +
        "printed before the pixels become visible."),
      D("Pixelation", "Visible blocks of individual pixels, which appear when an image is printed " +
        "or shown larger than its resolution can support."),
      P("So keep the highest-resolution version there is. For large prints, photographers often " +
        "keep files as TIFF, a lossless format that preserves all of the image data."),
      N("<b>A correction to the course text.</b> TIFF does not add resolution — nothing can. It " +
        "keeps every pixel a file already has, where a lossy format would discard some."),
      H("Exporting"),
      P("Export is usually under the File menu, and it asks which format to save in. That is why " +
        "the intended use comes first: the right format depends entirely on where the image is " +
        "going."),
      Q("Know what it is for.", "Of everything in editing, that is the one decision that settles " +
        "all the others.")
    ],
    check: { q: "When changing the size of an image, resolution can be lost.",
             opts: ["True", "False"], right: 0,
             why: "True. Shrinking an image discards pixel data, and it cannot be restored if the " +
                  "image is enlarged again." }
  }, {
    n: "6.8", t: "Touching Up and Adding Effects", kicker: "Retouching",
    stand: "Retouching is a skill of restraint. There is a fine line between enough and too much, " +
           "and too much makes a face look like plastic.",
    mins: 8,
    objectives: ["Describe best practices for touching up photos and applying filters"],
    body: [
      H("Red eye"),
      D("Red-eye effect", "Red pupils in a flash photograph of a person or animal. It happens when " +
        "the flash is very close to the lens in dim light, and is most common with compact " +
        "cameras."),
      P("In dim light the pupil is wide open, and a flash is too quick for it to close. The light " +
        "passes through the pupil, reflects off the fundus at the back of the eye, and comes " +
        "straight back out toward the lens."),
      D("Choroid", "The layer of blood vessels behind the retina that nourishes the back of the " +
        "eye. Its blood is what makes red eye red."),
      L("Preventing it", [
        ["Bounce flash", "Aim the flash at a pale ceiling or wall, so only diffused light reaches " +
                         "the eye."],
        ["More light", "Brighten the room, so the pupils are smaller."],
        ["Move the flash", "Get it further from the lens, where the camera allows."],
        ["Red-eye reduction", "A series of short, low-power flashes before the real one, so the " +
                              "pupils contract first."]
      ]),
      P("When it happens anyway, even basic editing software has a one-click red-eye tool. " +
        "Professional software has the user circle the area, for a more precise fix."),
      H("Scars and blemishes"),
      P("Headshot clients often ask for scars and blemishes to be removed, and editing software " +
        "has several tools for it. The first two both work from a sampling point."),
      D("Sampling point", "The part of the image a tool copies from — the area you want to keep, " +
        "painted over the distraction."),
      D("Clone stamp", "Paints an exact copy of the sampled area. It keeps defined edges, so it " +
        "suits areas where lines need to stay crisp."),
      D("Healing brush", "Uses only the colour of the sampled area, blended into the highlights " +
        "and shadows of the problem area. Softer and less visible, so it suits scars and " +
        "blemishes."),
      D("Spot healing brush", "Blends like the healing brush, but chooses its own sample. Works " +
        "best when the blemish is surrounded by similar colour and texture."),
      D("Patch tool", "Blends like the healing brush, but works from a selection rather than " +
        "brush strokes, and makes sure the pixels match the area they are copied to. Best for " +
        "larger areas with unusual shapes."),
      H("Filters"),
      P("Filters began as physical attachments screwed onto the end of a lens. In software and on " +
        "social media, a filter changes an image's colour balance and tone — and with them, the " +
        "feeling the picture gives."),
      D("Vintage filter", "Makes an image look as if it were taken years ago and has aged, usually " +
        "with brownish-yellow tones."),
      D("Sepia", "A monochromatic filter that renders an image in shades of brown instead of grey. " +
        "Named for the pigment once taken from cuttlefish."),
      N("Vintage and sepia look alike but differ: sepia is monochromatic, and vintage keeps some " +
        "colour."),
      Q("No wrong way, if it is the intended way.", "Experimenting is how an editor learns which " +
        "filters and techniques are theirs.")
    ],
    check: { q: "A client wants a scar removed from a portrait so the skin looks natural and " +
                "blended. Which tool suits it best?",
             opts: ["Clone stamp", "Healing brush", "Red-eye tool", "Sepia filter"], right: 1,
             why: "The healing brush blends sampled colour into the surrounding highlights and " +
                  "shadows, so the fix disappears. The clone stamp would leave defined edges." }
  }, {
    n: "6.9", t: "You as the Photographer", kicker: "Theme and style",
    stand: "Carry a camera everywhere, and something keeps catching your eye. That something is " +
           "where a portfolio begins.",
    mins: 5,
    objectives: ["Explain the purpose of using a theme in photography",
                 "Describe some of the ways in which photographers develop a style of capturing " +
                 "and editing images"],
    body: [
      H("A theme"),
      D("Theme", "The subject or message a photographer keeps returning to, reflecting their " +
        "interests, beliefs and concerns. A portfolio should carry one."),
      P("Not every portfolio needs the same theme, but every image in one portfolio should carry " +
        "the same message. Photographers often find their theme by noticing what keeps pulling " +
        "their attention — and then photographing it on purpose."),
      N("Many passionate photographers choose a theme that challenges a social issue. It can draw " +
        "strongly opposed reactions, and it can also bring awareness, and change, to something the " +
        "world was not looking at."),
      H("A style of shooting"),
      P("Photographers are known for their technique too: film or digital, modern cameras or ones " +
        "from photography's early years, chosen for a particular effect. Finding a style takes " +
        "practice. Look at a group of photographs and notice which styles and angles stand out — " +
        "those are probably the ones you will want to shoot."),
      H("A style of editing"),
      D("Editing style", "The consistent way a photographer processes images — dark and " +
        "high-contrast, highly saturated, even with colours inverted so the sky is green and the " +
        "grass is blue. It is often what viewers recognise first."),
      P("Two photographers can shoot the same subjects and still be told apart by how they edit. " +
        "Whatever the style, it has to serve the message and the feeling of the portfolio."),
      Q("Art is a science, and science is an art.", "Both are learned by experiment, and so is a " +
        "style.")
    ],
    check: { q: "It is a practical choice to create a portfolio that has a particular theme or " +
                "emotion.",
             opts: ["True", "False"], right: 0,
             why: "True. A theme ties the portfolio together, so every image carries the same " +
                  "message." }
  }];
})();
