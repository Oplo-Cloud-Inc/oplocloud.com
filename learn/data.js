/* ==========================================================================
   Oplo Learn — curriculum, study sets, accounts and enrolment records.
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
      ["Aperture", "The opening that lets light through the lens, measured in f-stops. A wider opening admits more light and blurs the background more."],
      ["Shutter speed", "How long the sensor is exposed. Fast freezes motion; slow lets it blur."],
      ["ISO", "The sensor's sensitivity to light. Raising it brightens a dark scene and adds grain."],
      ["Exposure triangle", "Aperture, shutter speed and ISO together. Change one and at least one other has to move to hold the exposure."],
      ["Depth of field", "How much of the scene is acceptably sharp, from front to back."],
      ["Focal length", "How much of the scene the lens takes in, in millimetres. Longer is narrower and more magnified."],
      ["Rule of thirds", "Placing the subject on a third rather than dead centre, which usually reads as more considered."],
      ["White balance", "Telling the camera what counts as white, so the rest of the colours land honestly."],
      ["Exposure", "The total light reaching the sensor. Too little is underexposed, too much is blown out."],
      ["Raw", "The unprocessed sensor file. It keeps far more information than a JPEG, so it survives editing."]
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
    ]}
  };

  /* ------------------------------------------------------------ Courses */
  var MEDIA_UNITS = ["What are Media Arts?", "The Basics of Design", "Digital Media and Web Design",
    "The “Web 2.0”", "Waves and Sound", "Intro to Photography", "Video Basics",
    "Intro to Animation", "Audio/Video Production"];

  var BIZ_A = ["Introduction to Business", "Economics and Business",
    "Business Ethics and Social Responsibility", "International Business", "Business Writing",
    "Types of Business Ownership", "Small Business and Entrepreneurship", "Management",
    "Organizational Structure", "Operations Management", "Motivation Theories and Applications"];
  var BIZ_B = ["Human Resource Management", "Organized Labor Relations", "Marketing and the Customer",
    "Product and Pricing Strategies", "Product Distribution", "Marketing Communications",
    "Financial Statements", "Financial Management", "Managing Information Technology",
    "Functions of Money and Banking"];

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
    sets: { 1: "media-1", 2: "media-2", 5: "media-5", 6: "media-6" },
    grading: [["Quizzes", 35], ["Assignments", 35], ["Mid-term and final exams", 30]],
    textbook: "EHS Media Arts — © Excel Education Systems, Inc., 2021."
  };

  var BIZ = {
    id: "biz", t: "Introduction to Business", hue: "#e8a317", subject: "Social Studies",
    level: "Introductory", tag: "Two semesters",
    d: "Planning and launching something real — economics, structure, money and the plan that holds it together.",
    lede: "What it actually takes to plan and launch a product or service. Economics, costs and profit, business types, money and taxes, financing, and how a business sits inside the society around it — built toward writing a plan you could hand to somebody.",
    glyph: '<path d="M3 20h18M6 20V9l6-4 6 4v11"/><path d="M10 20v-5h4v5"/>',
    objectives: [
      "Understand basic economic principles.",
      "Develop workplace communication skills.",
      "Describe how businesses are structured and operated.",
      "Design a business plan.",
      "Weigh financial risks and rewards."
    ],
    parts: [{ name: "Semester A", units: BIZ_A }, { name: "Semester B", units: BIZ_B }],
    sets: { 1: "biz-1" },
    grading: [["Quizzes", 50], ["Written assignments", 20], ["Midterm and final exams", 30]],
    textbook: "Introduction to Business — Boundless, CC BY-SA 4.0."
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
        stub("alg", "Algebra I", "Math", BLUE, "Variables, equations, and the habit of doing the same thing to both sides.", SIGMA),
        stub("geo", "Geometry",  "Math", BLUE, "Proof as an argument you could win, not a form to fill in.", SIGMA)] },
    { n: "Science", hue: GREEN,
      d: "Method first: what would have to be true, and how would you find out.",
      courses: [
        stub("bio",  "Biology",   "Science", GREEN, "Cells, inheritance and ecosystems — systems that keep themselves going.", FLASK),
        stub("chem", "Chemistry", "Science", GREEN, "Why substances behave as they do, from the structure up.", FLASK),
        stub("phys", "Physics",   "Science", GREEN, "Motion, force and energy, with the algebra kept in service of the idea.", FLASK)] },
    { n: "Social Studies", hue: "#e8a317",
      d: "How societies organise themselves — economies, institutions, and the past that shaped them.",
      courses: [BIZ,
        stub("hist", "World History", "Social Studies", "#e8a317", "Causes and consequences, argued from sources rather than recited.", GLOBE),
        stub("civ",  "Civics",        "Social Studies", "#e8a317", "How power is arranged, checked, and used where you live.", GLOBE)] }
  ];

  /* ------------------------------------------------------- Prerequisites
     Which unit has to be understood before another one makes sense. The
     knowledge map draws this, and "your next step" walks it — a unit whose
     ground has not been laid is not the next thing to do, however far down
     the list you are. */
  var PRE = {
    media: { 1: [], 2: [1], 3: [2], 4: [3], 5: [1], 6: [2], 7: [6], 8: [6], 9: [5, 7] },
    seeing: { 1: [], 2: [1], 3: [2] },
    biz: {}
  };

  /* ------------------------------------------------------------- Students
     One account. There is no demo login and no shared password.

     A word on what this can and cannot be. oplocloud.com is served as static
     files, so there is no server here to check a password against — whatever
     the page needs in order to verify one has to be shipped to the browser
     first, where anyone can read it. That is a property of the hosting, not
     a shortcut taken here, and no amount of client-side work changes it.

     What it does instead is the strongest thing available without a server:
     the password is never stored, only a PBKDF2-SHA256 verifier over a random
     per-account salt at 210,000 iterations. Guessing against that costs real
     time per attempt rather than being a lookup, so the verifier leaking is
     not the same as the password leaking. Real authentication — a server that
     holds the verifier and hands back a signed session — is a hosting change,
     and Auth.verify in app.js is the one function it would replace.

     To set a password:
       python3 -c "import hashlib,os,base64 as b;s=os.urandom(16);\
       print(b.b64encode(s).decode(), b.b64encode(hashlib.pbkdf2_hmac(\
       'sha256', b'PASSWORD', s, 210000, 32)).decode())"
  */
  var ITERATIONS = 210000;

  var STUDENTS = [{
    id: "sehej",
    name: "Sehej Kaur", initials: "SK", first: "Sehej",
    email: "sehejkaur776@gmail.com",
    salt: "hei4SKXhMbLKO8AJsHrndA==",
    verifier: "aSY04AWAeRgSJfXn8Lg1nZcIOicjXw4tLiwv+OwC9bE=",
    assigned: ["media"],
    grade: 11,
    enrolment: {
      program: "High School Silver Program (Full Year)",
      rating: 4.8, ratings: 45,
      status: "New/Unprocessed", progress: 0,
      stats: [
        ["Credits earned", "0.00 / 21.50"],
        ["Weighted GPA", "N/A"],
        ["Unweighted GPA", "0.00"],
        ["Current grade level", "11"],
        ["Documents received", "No"]
      ],
      detail: [
        ["Enrollment", [
          ["Enrollment ID", "EHS-en26-6695e"],
          ["Program ID", "pgm-23-003b"],
          ["Enrollment date", "August 28, 2026"],
          ["Expiration date", "August 28, 2027"],
          ["Last date of attendance", "September 8, 2026"],
          ["Records release", "N/A"],
          ["Date of birth", "August 20, 2010"]
        ]],
        ["Tuition", [
          ["Program cost", "$1,950.00"],
          ["Tuition balance due", "$1,755.00"],
          ["Additional fees due", "$0.00"],
          ["Total installments", "10"],
          ["Installments remaining", "9"],
          ["Next payment due", "September 29, 2026"]
        ]]
      ],
      balance: "$1,755.00",
      courses: ["Media Arts EHS"]
    }
  }];

  return { SUBJECTS: SUBJECTS, SETS: SETS, PROBLEMS: SEEING_P, PRE: PRE, ITERATIONS: ITERATIONS,
           SEEING: SEEING, MEDIA: MEDIA, BIZ: BIZ, STUDENTS: STUDENTS };
})();
