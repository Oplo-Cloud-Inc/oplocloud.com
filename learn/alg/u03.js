/* ==========================================================================
   Algebra I — Unit 3: Working with units. See lab/core.js for the format.

   Written the way Units 1 and 2 are, for someone meeting the idea for the
   first time. Units are treated as part of the arithmetic: a conversion is
   a multiplication by a fraction worth exactly one, and units cancel top
   and bottom the way numbers do. The chain of conversion factors (the
   "units" scene) lets a student build a conversion and watch the units
   cross out before being asked to write one.

   Three lessons, following Khan Academy's topics for the unit: rate
   conversion; appropriate units and formulas; word problems with more than
   one unit. Five skills, the unit test at the end, and notes that put the
   unit on one page.
   Standards: HSN.Q.A.1, HSN.Q.A.2, HSN.Q.A.3.
   ========================================================================== */
(function () {
  "use strict";
  var L = window.OPLO_LAB;
  var num = L.num, mc = L.mc;

  function lines(arr) { return arr.map(function (t) { return "$" + t + "$"; }).join("<br>"); }
  function r6(v) { return Math.round(v * 1e6) / 1e6; }
  // A conversion fraction, typeset: \frac{60 \text{ min}}{1 \text{ h}}
  function fr(a, ua, b, ub) { return "\\frac{" + num(a) + "\\text{ " + ua + "}}{" + num(b) + "\\text{ " + ub + "}}"; }
  function q(v, u) { return num(v) + "\\text{ " + (u === "day" && v !== 1 ? "days" : u) + "}"; }
  function money(v) { return v % 1 ? v.toFixed(2) : String(v); }

  L.unit("alg", 3, {
    title: "Working with units",
    lessons: [
      /* ============================================================== 1 */
      {
        title: "Multiplying by one",
        blurb: "A conversion is a fraction worth exactly one. Units cancel like numbers do.",
        mins: 11, v: 1,
        steps: [
          { type: "num", kicker: "Warm up", prompt: "How many minutes are there in 3 hours?", answer: 180, post: "minutes",
            near: [{ v: 20, fb: "An hour is **longer** than a minute, so there are more minutes than hours: $3 \\times 60$." }, { v: 63, fb: "Each hour is 60 minutes, so multiply: $3 \\times 60$." }],
            hints: ["Each hour is 60 minutes."], why: "$3 \\times 60 = 180$ minutes." },
          { type: "learn", kicker: "The idea",
            prompt: "Here is what you just did, written so the units are part of the sum. Since $1\\text{ h} = 60\\text{ min}$, the fraction $" + fr(60, "min", 1, "h") + "$ has the same amount on top and bottom — it is worth exactly $1$. Multiplying by $1$ never changes an amount, only the units it is written in.",
            scene: { type: "walk", rows: [
              { m: "3\\text{ h} \\times " + fr(60, "min", 1, "h"), say: "Multiply by a fraction worth one, with the unit you want on **top**." },
              { m: "3\\,\\cancel{\\text{h}} \\times \\frac{60\\text{ min}}{1\\,\\cancel{\\text{h}}}", say: "Hours on top and hours on the bottom cancel, exactly as $\\frac{3}{3}$ would." },
              { m: "180\\text{ min}", say: "What is left is minutes: $3 \\times 60 = 180$." }] },
            gate: true,
            then: "A fraction like $" + fr(60, "min", 1, "h") + "$ is called a **conversion factor**. Its job is to cancel the unit you have and leave the unit you want." },
          { type: "learn", kicker: "Try it",
            prompt: "Build the conversion yourself. Start with $2.5$ km and aim for metres. Click the conversion factor to put it in the chain; click ⇅ to turn it upside down. You're done when only metres are left.",
            scene: { type: "units", start: [2.5, "km", ""], target: ["m", ""], factors: [[1000, "m", 1, "km"]] },
            gate: true,
            then: "$2.5\\text{ km} \\times " + fr(1000, "m", 1, "km") + " = 2500\\text{ m}$. Kilometres cancel; metres are left." },
          { type: "choice", prompt: "To change **seconds** into **minutes**, which factor should you multiply by?", skill: "Converting units",
            options: [{ t: "$" + fr(1, "min", 60, "s") + "$" },
                      { t: "$" + fr(60, "s", 1, "min") + "$", fb: "That puts seconds on top, so seconds would pile up instead of cancelling. The unit you **have** goes on the bottom." },
                      { t: "$" + fr(60, "min", 1, "s") + "$", fb: "That fraction isn't worth one: 60 minutes is not the same time as 1 second." }],
            answer: 0, hints: ["The unit you want (minutes) goes on top; the unit you have (seconds) on the bottom, so it cancels."],
            why: "Seconds on the bottom cancel the seconds you have, leaving minutes." },
          { type: "num", prompt: "How many minutes is $450$ seconds?", answer: 7.5, post: "minutes", skill: "Converting units",
            near: [{ v: 27000, fb: "That multiplied by 60. A minute is **longer** than a second, so there should be fewer minutes: divide by 60." }],
            hints: ["$450\\text{ s} \\times " + fr(1, "min", 60, "s") + "$", "That is $450 \\div 60$."],
            why: "$450\\text{ s} \\times " + fr(1, "min", 60, "s") + " = \\frac{450}{60}\\text{ min} = 7.5\\text{ min}$." },
          { type: "learn", kicker: "A rate",
            prompt: "A **rate** compares two quantities with different units, like kilometres **per** hour. Converting a rate works the same way — you might only need to change the unit on the bottom.",
            scene: { type: "walk", rows: [
              { m: "90\\;\\frac{\\text{km}}{\\text{h}}", say: "A train travels 90 km every hour. How far per **minute**?" },
              { m: "\\frac{90\\text{ km}}{1\\text{ h}} \\times " + fr(1, "h", 60, "min"), say: "Hours are on the bottom now, so the factor puts hours on **top** to cancel them." },
              { m: "\\frac{90\\text{ km}}{60\\text{ min}}", say: "Hours cancel. What is left is km per minute." },
              { m: "1.5\\;\\frac{\\text{km}}{\\text{min}}", say: "$90 \\div 60 = 1.5$." }] },
            gate: true },
          { type: "units", prompt: "Convert $90$ km per hour into km per **minute**. Build the chain.", skill: "Rate conversion",
            start: [90, "km", "h"], target: ["km", "min"], factors: [[60, "min", 1, "h"]], answer: [[0, true]],
            hints: ["The hours are on the bottom. To cancel them, the factor needs hours on top — flip it."],
            why: "$\\frac{90\\text{ km}}{1\\text{ h}} \\times " + fr(1, "h", 60, "min") + " = 1.5\\;\\frac{\\text{km}}{\\text{min}}$." },
          { type: "learn", kicker: "Two at once",
            prompt: "Sometimes both units change. Use one conversion factor for each, and check that every unit you don't want cancels.",
            scene: { type: "walk", rows: [
              { m: "36\\;\\frac{\\text{km}}{\\text{h}} \\to \\;?\\;\\frac{\\text{m}}{\\text{s}}", say: "Kilometres to metres on top, hours to seconds on the bottom." },
              { m: "\\frac{36\\text{ km}}{1\\text{ h}} \\times " + fr(1000, "m", 1, "km") + " \\times " + fr(1, "h", 3600, "s"), say: "km cancels km; h cancels h." },
              { m: "\\frac{36 \\times 1000\\text{ m}}{3600\\text{ s}}", say: "Multiply the tops, multiply the bottoms." },
              { m: "10\\;\\frac{\\text{m}}{\\text{s}}", say: "$36000 \\div 3600 = 10$." }] },
            gate: true },
          { type: "units", prompt: "A cyclist rides at $18$ km per hour. Convert that to metres per second.", skill: "Rate conversion",
            start: [18, "km", "h"], target: ["m", "s"], factors: [[1000, "m", 1, "km"], [3600, "s", 1, "h"]], answer: [[0, false], [1, true]],
            hints: ["Put the kilometres-to-metres factor in first, with metres on top.", "Then cancel the hours: the hours-to-seconds factor needs hours on top."],
            why: "$\\frac{18\\text{ km}}{1\\text{ h}} \\times " + fr(1000, "m", 1, "km") + " \\times " + fr(1, "h", 3600, "s") + " = 5\\;\\frac{\\text{m}}{\\text{s}}$." },
          { type: "num", prompt: "A leaky tap drips $3$ millilitres every minute. How many **litres** is that per day? ($1$ L $= 1000$ mL)", answer: 4.32, post: "litres per day", skill: "Rate conversion",
            near: [{ v: 4320, fb: "That's millilitres per day. Divide by 1000 to get litres." }, { v: 0.18, fb: "That's litres per **hour**. A day has 24 of them." }],
            hints: ["Minutes to days: $3 \\times 60 \\times 24$ mL per day.", "Then millilitres to litres: divide by 1000."],
            why: "$\\frac{3\\text{ mL}}{1\\text{ min}} \\times " + fr(60, "min", 1, "h") + " \\times " + fr(24, "h", 1, "day") + " \\times " + fr(1, "L", 1000, "mL") + " = 4.32\\;\\frac{\\text{L}}{\\text{day}}$." },
          { type: "choice", prompt: "Which is faster: $1$ mile per minute, or $50$ miles per hour?", skill: "Rate conversion",
            options: [{ t: "$1$ mile per minute" }, { t: "$50$ miles per hour", fb: "Convert the first: 1 mile every minute is 60 miles every hour — more than 50." }, { t: "They are the same", fb: "1 mile per minute is 60 miles per hour, not 50." }],
            answer: 0, hints: ["There are 60 minutes in an hour. How far do you go in an hour at 1 mile a minute?"],
            why: "$\\frac{1\\text{ mi}}{1\\text{ min}} \\times " + fr(60, "min", 1, "h") + " = 60\\;\\frac{\\text{mi}}{\\text{h}}$, which beats 50." }
        ]
      },
      /* ============================================================== 2 */
      {
        title: "Sensible quantities, sensible units",
        blurb: "Choosing what to measure, reading a formula's units, and comparing rates fairly.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "To describe a situation with numbers you first choose **what** to measure and **in what units**. A good choice makes the number easy to read and fair to compare. <br><br>How crowded is a city? The number of people alone won't tell you — a big city can hold many people and still feel empty. **People per square kilometre** will: it says how many people share each piece of ground.",
            after: "A quantity that divides one thing by another — people per km², dollars per hour, miles per gallon — is a **rate**, and it is often the fairest thing to compare." },
          { type: "choice", prompt: "Which quantity best compares how **fuel-efficient** two cars are?", skill: "Choosing quantities",
            options: [{ t: "Miles per gallon" },
                      { t: "Gallons in a full tank", fb: "That's how big the tank is, not how far each gallon takes you." },
                      { t: "Top speed in miles per hour", fb: "Speed says nothing about how much fuel is used." },
                      { t: "Miles driven last year", fb: "That depends on how much the owner drove, not on the car." }],
            answer: 0, why: "Miles per gallon says how far each gallon of fuel goes — the more, the more efficient." },
          { type: "choice", prompt: "You're measuring how fast a snail moves. Which unit gives the most sensible numbers?", skill: "Choosing quantities",
            options: [{ t: "Centimetres per minute" },
                      { t: "Kilometres per hour", fb: "A snail manages about $0.03$ km per hour — the numbers would be tiny and awkward." },
                      { t: "Metres per day", fb: "Possible, but you'd have to watch the snail for a whole day. Minutes and centimetres suit the scale." }],
            answer: 0, why: "A snail covers a few centimetres in a minute, so cm per minute gives numbers like $5$ rather than $0.003$." },
          { type: "learn", kicker: "Units in a formula",
            prompt: "A formula tells you the units of its answer too: do to the units exactly what the formula does to the numbers.",
            scene: { type: "walk", rows: [
              { m: "V = l \\times w \\times h", say: "The volume of a box-shaped pool: length times width times depth." },
              { m: "25\\text{ m} \\times 10\\text{ m} \\times 2\\text{ m}", say: "Put in the measurements, with their units." },
              { m: "500\\;\\text{m} \\cdot \\text{m} \\cdot \\text{m} = 500\\text{ m}^3", say: "Metres times metres times metres is **cubic metres**, written $\\text{m}^3$." }] },
            gate: true },
          { type: "choice", prompt: "Density is mass divided by volume: $d = \\frac{m}{V}$. If mass is in grams and volume in cubic centimetres, what are the units of density?", skill: "Formulas and units",
            options: [{ t: "grams per cubic centimetre, $\\text{g/cm}^3$" },
                      { t: "$\\text{g} \\cdot \\text{cm}^3$", fb: "The formula **divides** mass by volume, so the units divide too." },
                      { t: "$\\text{cm}^3\\text{/g}$", fb: "That's volume over mass — upside down." }],
            answer: 0, why: "$\\frac{\\text{g}}{\\text{cm}^3}$: the units do what the formula does." },
          { type: "num", prompt: "A rectangular tank is $2$ m long, $1.5$ m wide and $0.8$ m deep. What is its volume, in cubic metres?", answer: 2.4, post: "m³", skill: "Formulas and units",
            hints: ["$V = l \\times w \\times h$."], why: "$2 \\times 1.5 \\times 0.8 = 2.4\\text{ m}^3$." },
          { type: "learn", kicker: "Comparing rates",
            prompt: "Two rates can only be compared once they are in the **same** units.",
            scene: { type: "walk", rows: [
              { say: "Printer A prints $45$ pages in $3$ minutes. Printer B prints $1000$ pages an hour. Which is faster?" },
              { m: "\\frac{45\\text{ pages}}{3\\text{ min}} = 15\\;\\frac{\\text{pages}}{\\text{min}}", say: "Put A in pages per minute." },
              { m: "\\frac{1000\\text{ pages}}{1\\text{ h}} \\times " + fr(1, "h", 60, "min") + " \\approx 16.7\\;\\frac{\\text{pages}}{\\text{min}}", say: "Put B in pages per minute too." },
              { say: "Now they can be compared: B is faster, by nearly 2 pages a minute." }] },
            gate: true },
          { type: "choice", prompt: "Tap A fills a bucket at $12$ litres per minute. Tap B at $0.25$ litres per second. Which is faster?", skill: "Formulas and units",
            options: [{ t: "Tap B" }, { t: "Tap A", fb: "Put B in litres per minute: $0.25 \\times 60 = 15$, which is more than 12." }, { t: "They're the same", fb: "$0.25$ L per second is $15$ L per minute, not 12." }],
            answer: 0, hints: ["Change B to litres per minute: there are 60 seconds in a minute."],
            why: "$0.25\\;\\frac{\\text{L}}{\\text{s}} \\times " + fr(60, "s", 1, "min") + " = 15\\;\\frac{\\text{L}}{\\text{min}}$, more than A's 12." },
          { type: "learn", kicker: "How exact?",
            prompt: "An answer can't be more exact than the measurements it came from. A rug measured as $1.8$ m by $2.4$ m has area $1.8 \\times 2.4 = 4.32$ m² — but since each side was only measured to a tenth of a metre, “about $4.3$ m²” is the honest answer.",
            after: "Report a measurement to a sensible number of digits, and always with its unit." },
          { type: "choice", prompt: "A runner's time is measured with a stopwatch as $12.4$ seconds for $100$ m. Which is the most sensible way to report her speed?", skill: "Choosing quantities",
            options: [{ t: "About $8.1$ m/s" }, { t: "$8.064516$ m/s", fb: "The stopwatch was read to a tenth of a second, so six decimal places claims far more precision than the timing had." },
                      { t: "$8$", fb: "A number without a unit doesn't say what was measured." }],
            answer: 0, why: "$100 \\div 12.4 \\approx 8.06$, reported to the precision of the measurements, with its unit: about $8.1$ m/s." }
        ]
      },
      /* ============================================================== 3 */
      {
        title: "Letting the units solve it",
        blurb: "Word problems with several units: chain the rates so everything cancels but the answer.",
        mins: 10, v: 1,
        steps: [
          { type: "learn", kicker: "Start here",
            prompt: "In a word problem with several rates, the units can tell you what to multiply. Write each rate as a fraction, chain them, and arrange them so every unit you don't want cancels.",
            scene: { type: "walk", rows: [
              { say: "A toy factory has machines that each make $12$ toys an hour. How many toys do $5$ machines make in an $8$-hour shift?" },
              { m: "5\\text{ machines} \\times \\frac{12\\text{ toys}}{1\\text{ machine} \\cdot \\text{h}} \\times 8\\text{ h}", say: "The rate is toys per machine per hour." },
              { m: "5 \\times 12 \\times 8\\text{ toys}", say: "Machines cancel, hours cancel, toys are left." },
              { m: "480\\text{ toys}", say: "" }] },
            gate: true },
          { type: "num", prompt: "A bakery's ovens each bake $30$ loaves an hour. How many loaves do $4$ ovens bake in $6$ hours?", answer: 720, post: "loaves", skill: "Using units to solve problems",
            near: [{ v: 120, fb: "That's 4 ovens for **one** hour. The shift is 6 hours." }, { v: 180, fb: "That's one oven for 6 hours. There are 4 ovens." }],
            hints: ["$4\\text{ ovens} \\times \\frac{30\\text{ loaves}}{1\\text{ oven} \\cdot \\text{h}} \\times 6\\text{ h}$."],
            why: "$4 \\times 30 \\times 6 = 720$ loaves." },
          { type: "learn", kicker: "A road trip",
            prompt: "Here the units show which way up each rate goes.",
            scene: { type: "walk", rows: [
              { say: "A car goes $30$ miles on a gallon of petrol, which costs \\$3.20 a gallon. What does a $450$-mile trip cost in fuel?" },
              { m: "450\\text{ mi} \\times \\frac{1\\text{ gal}}{30\\text{ mi}}", say: "Miles to gallons: miles on the bottom, so they cancel." },
              { m: "15\\text{ gal} \\times \\frac{\\$3.20}{1\\text{ gal}}", say: "Gallons to dollars: gallons on the bottom." },
              { m: "\\$48", say: "$15 \\times 3.20 = 48$." }] },
            gate: true },
          { type: "num", prompt: "A car goes $40$ miles on a gallon, and petrol costs \\$3.50 a gallon. How much does the fuel for a $600$-mile trip cost, in dollars?", answer: 52.5, pre: "\\$", skill: "Using units to solve problems",
            near: [{ v: 15, fb: "That's the number of gallons. Each one costs \\$3.50." }, { v: 8400, fb: "Miles times miles-per-gallon gives mi²/gal, not gallons. Divide by 40 instead." }],
            hints: ["$600\\text{ mi} \\times \\frac{1\\text{ gal}}{40\\text{ mi}} = 15\\text{ gal}$.", "Then $15\\text{ gal} \\times \\frac{\\$3.50}{1\\text{ gal}}$."],
            why: "$600 \\div 40 = 15$ gallons, and $15 \\times 3.50 = \\$52.50$." },
          { type: "learn", kicker: "A dose",
            prompt: "Medicine is often dosed by body weight. A conversion factor turns the weight into the right unit first.",
            scene: { type: "walk", rows: [
              { say: "A dose is $15$ mg per kg of body weight. A child weighs $44$ pounds, and $1$ kg $= 2.2$ lb. How many mg?" },
              { m: "44\\text{ lb} \\times \\frac{1\\text{ kg}}{2.2\\text{ lb}}", say: "Pounds to kilograms." },
              { m: "20\\text{ kg} \\times \\frac{15\\text{ mg}}{1\\text{ kg}}", say: "Kilograms to milligrams of medicine." },
              { m: "300\\text{ mg}", say: "" }] },
            gate: true },
          { type: "num", prompt: "A dose is $10$ mg per kg of body weight. A patient weighs $66$ pounds ($1$ kg $= 2.2$ lb). How many milligrams should they get?", answer: 300, post: "mg", skill: "Using units to solve problems",
            near: [{ v: 660, fb: "The dose is per **kilogram**, so turn the pounds into kilograms first: $66 \\div 2.2$." }, { v: 30, fb: "That's the weight in kg. Each kg needs 10 mg." }],
            hints: ["$66 \\div 2.2 = 30$ kg.", "Then $30 \\times 10$ mg."],
            why: "$66\\text{ lb} \\times \\frac{1\\text{ kg}}{2.2\\text{ lb}} \\times \\frac{10\\text{ mg}}{1\\text{ kg}} = 300\\text{ mg}$." },
          { type: "choice", prompt: "Paint covers $12$ m² per litre, and a wall is $30$ m². Which calculation gives the litres needed?", skill: "Using units to solve problems",
            options: [{ t: "$30\\text{ m}^2 \\times \\frac{1\\text{ L}}{12\\text{ m}^2}$" },
                      { t: "$30\\text{ m}^2 \\times \\frac{12\\text{ m}^2}{1\\text{ L}}$", fb: "The m² don't cancel there — they multiply to m⁴ per litre. Put m² on the bottom." },
                      { t: "$12 \\times 30$ litres", fb: "$360$ litres would be enough for a house. The units show you should divide." }],
            answer: 0, why: "m² cancels m², leaving litres: $30 \\div 12 = 2.5$ L." },
          { type: "num", prompt: "A typist types $55$ words a minute. How long does a $2200$-word essay take, in minutes?", answer: 40, post: "minutes", skill: "Using units to solve problems",
            hints: ["$2200\\text{ words} \\times \\frac{1\\text{ min}}{55\\text{ words}}$."], why: "$2200 \\div 55 = 40$ minutes." }
        ]
      }
    ],

    /* ================================================================= Notes */
    notes: [
      { t: "Conversion factors",
        say: ["A **conversion factor** is a fraction with equal amounts on top and bottom, like $" + fr(60, "min", 1, "h") + "$. It is worth exactly $1$, so multiplying by it changes the units but not the amount.",
              "Put the unit you **want** on top and the unit you **have** on the bottom, so the one you have cancels."],
        keys: [["$1$ h", "$60$ min, and $1$ min $= 60$ s"], ["$1$ km", "$1000$ m, and $1$ m $= 100$ cm"], ["$1$ kg", "$1000$ g"], ["$1$ L", "$1000$ mL"], ["$1$ ft", "$12$ in, and $1$ mile $= 5280$ ft"]],
        eg: { q: "Convert $450$ seconds to minutes.",
              rows: [["450\\text{ s} \\times " + fr(1, "min", 60, "s"), "Seconds on the bottom, to cancel."], ["7.5\\text{ min}", "$450 \\div 60$."]] },
        watch: "A bigger unit means a smaller number. If you convert to a bigger unit and the number grows, the factor is upside down." },
      { t: "Converting a rate",
        say: ["A **rate** compares two quantities in different units — km per hour, dollars per kilogram. Write it as a fraction and convert the top and the bottom with a factor each.",
              "Check the chain: every unit you don't want should appear once on top and once on the bottom."],
        eg: { q: "Convert $36$ km/h to m/s.",
              rows: [["\\frac{36\\text{ km}}{1\\text{ h}} \\times " + fr(1000, "m", 1, "km") + " \\times " + fr(1, "h", 3600, "s"), "km cancels km, h cancels h."], ["10\\;\\frac{\\text{m}}{\\text{s}}", "$36 \\times 1000 \\div 3600$."]] },
        watch: "To cancel a unit on the **bottom** of a rate, the factor needs that unit on **top**." },
      { t: "Choosing quantities and units",
        say: ["When you describe a situation with a number, choose what to measure so the number answers the question — fuel efficiency in miles per gallon, how crowded a place is in people per square kilometre.",
              "Choose units that suit the size of the thing: a snail in centimetres per minute, a plane in kilometres per hour.",
              "Report no more digits than your measurements justify, and always give the unit."],
        watch: "A number on its own, like “$8$”, says nothing. “$8$ m/s” says what was measured." },
      { t: "Units in a formula",
        say: ["Do to the units exactly what the formula does to the numbers. Length times width gives square units ($\\text{m}^2$); length times width times height gives cubic units ($\\text{m}^3$); mass divided by volume gives $\\text{g/cm}^3$.",
              "To compare two rates, first put them in the same units."],
        eg: { q: "Tap A gives $12$ L/min; tap B gives $0.25$ L/s. Which is faster?",
              rows: [["0.25\\;\\frac{\\text{L}}{\\text{s}} \\times " + fr(60, "s", 1, "min") + " = 15\\;\\frac{\\text{L}}{\\text{min}}", "Put B in L per minute."]],
              a: "$15 > 12$, so tap B is faster." } },
      { t: "Word problems with several units",
        say: ["Write every rate as a fraction with its units. Then chain them — starting from the quantity you know — so that each unit you don't want cancels, leaving only the unit of the answer.",
              "If the units don't cancel, a rate is upside down."],
        eg: { q: "At $30$ miles per gallon and \\$3.20 a gallon, what does fuel for $450$ miles cost?",
              rows: [["450\\text{ mi} \\times \\frac{1\\text{ gal}}{30\\text{ mi}} \\times \\frac{\\$3.20}{1\\text{ gal}}", "Miles cancel, gallons cancel."], ["\\$48", "$15$ gallons at \\$3.20."]] },
        watch: "Multiplying $450$ miles by $30$ miles per gallon gives mi²/gal — a unit that makes no sense is the sign that you should have divided." }
    ],

    /* ================================================================ Skills */
    skills: [
      { id: "a3-convert", title: "Converting units", lesson: 1,
        gen: function (R) {
          var C = R.pick([
            { a: "h", b: "min", k: 60, big: true }, { a: "min", b: "s", k: 60, big: true }, { a: "day", b: "h", k: 24, big: true },
            { a: "km", b: "m", k: 1000, big: true }, { a: "m", b: "cm", k: 100, big: true }, { a: "kg", b: "g", k: 1000, big: true },
            { a: "L", b: "mL", k: 1000, big: true }, { a: "ft", b: "in", k: 12, big: true }, { a: "yd", b: "ft", k: 3, big: true }]);
          var down = R.chance(0.5);            // big unit to small unit multiplies
          var n = down ? R.pick([2, 3, 4, 5, 6, 7, 8, 1.5, 2.5, 0.5]) : C.k * R.pick([2, 3, 4, 5, 6, 1.5, 0.5, 2.5]);
          var from = down ? C.a : C.b, to = down ? C.b : C.a;
          var ans = r6(down ? n * C.k : n / C.k);
          var f = down ? fr(C.k, C.b, 1, C.a) : fr(1, C.a, C.k, C.b);
          return { type: "num", prompt: "Convert $" + q(n, from) + "$ to " + to + ".", answer: ans, post: to,
            near: [{ v: r6(down ? n / C.k : n * C.k), fb: down ? "A " + C.b + " is smaller than a " + C.a + ", so there should be **more** of them. Multiply by " + C.k + "." : "A " + C.a + " is bigger than a " + C.b + ", so there should be **fewer** of them. Divide by " + C.k + "." }],
            hints: ["$1\\text{ " + C.a + "} = " + C.k + "\\text{ " + C.b + "}$.", "Multiply by $" + f + "$, so the " + from + " cancel."],
            why: "$" + q(n, from) + " \\times " + f + " = " + q(ans, to) + "$." };
        } },
      { id: "a3-rate", title: "Rate conversion", lesson: 1,
        gen: function (R) {
          var T = R.pick([
            function () { var v = 18 * R.int(1, 8); return { from: [v, "km", "h"], to: ["m", "s"], ans: v * 5 / 18,
              chain: fr(1000, "m", 1, "km") + " \\times " + fr(1, "h", 3600, "s"), hint: "Change km to m (× 1000) and hours to seconds (÷ 3600)." }; },
            function () { var v = R.int(2, 25); return { from: [v, "m", "s"], to: ["km", "h"], ans: v * 3.6,
              chain: fr(1, "km", 1000, "m") + " \\times " + fr(3600, "s", 1, "h"), hint: "Change m to km (÷ 1000) and seconds to hours (× 3600)." }; },
            function () { var v = 6 * R.int(2, 20); return { from: [v, "km", "h"], to: ["m", "min"], ans: v * 1000 / 60,
              chain: fr(1000, "m", 1, "km") + " \\times " + fr(1, "h", 60, "min"), hint: "Change km to m (× 1000) and hours to minutes (÷ 60)." }; },
            function () { var v = R.int(2, 12) * 0.5; return { from: [v, "L", "min"], to: ["L", "h"], ans: v * 60,
              chain: fr(60, "min", 1, "h"), hint: "Only the bottom changes: minutes to hours. There are 60 minutes in an hour, so 60 times as many litres." }; },
            function () { var v = R.int(2, 9) * 5; return { from: [v, "mL", "s"], to: ["L", "h"], ans: v * 3.6,
              chain: fr(1, "L", 1000, "mL") + " \\times " + fr(3600, "s", 1, "h"), hint: "Change mL to L (÷ 1000) and seconds to hours (× 3600)." }; },
            function () { var v = 60 * R.int(1, 6); return { from: [v, "words", "min"], to: ["words", "s"], ans: v / 60,
              chain: fr(1, "min", 60, "s"), hint: "Only the bottom changes: a minute is 60 seconds, so divide by 60." }; },
            function () { var v = R.pick([12, 15, 18, 24, 30, 36]); return { from: [v, "in", "s"], to: ["ft", "min"], ans: v / 12 * 60,
              chain: fr(1, "ft", 12, "in") + " \\times " + fr(60, "s", 1, "min"), hint: "Change inches to feet (÷ 12) and per second to per minute (× 60)." }; }
          ])();
          var ans = r6(T.ans), f = T.from;
          return { type: "num", prompt: "Convert $" + num(f[0]) + "\\;\\frac{\\text{" + f[1] + "}}{\\text{" + f[2] + "}}$ to " + T.to[0] + "/" + T.to[1] + ".",
            answer: ans, post: T.to[0] + "/" + T.to[1],
            hints: [T.hint, "The chain: $\\frac{" + q(f[0], f[1]) + "}{1\\text{ " + f[2] + "}} \\times " + T.chain + "$."],
            why: "$\\frac{" + q(f[0], f[1]) + "}{1\\text{ " + f[2] + "}} \\times " + T.chain + " = " + num(ans) + "\\;\\frac{\\text{" + T.to[0] + "}}{\\text{" + T.to[1] + "}}$." };
        } },
      { id: "a3-quant", title: "Defining appropriate quantities for modeling", lesson: 2,
        gen: function (R) {
          var B = R.pick([
            { p: "Which quantity best compares how **crowded** two cities are?", r: "People per square kilometre",
              w: [["Total population", "A big city can have many people and still have lots of room. Divide by the area."], ["Area in square kilometres", "Area alone says nothing about how many people are in it."]] },
            { p: "Which quantity best compares how **fuel-efficient** two cars are?", r: "Miles per gallon",
              w: [["Size of the fuel tank", "That's how much fuel it holds, not how far a gallon goes."], ["Top speed", "Speed doesn't measure fuel use."]] },
            { p: "Which quantity best compares how well two basketball players **shoot**?", r: "Baskets made per shot taken",
              w: [["Total baskets made", "A player who shoots more often will make more baskets without being more accurate."], ["Shots taken", "Taking shots isn't the same as making them."]] },
            { p: "Which quantity best compares the **value** of two sizes of cereal box?", r: "Price per gram",
              w: [["Price of the box", "A bigger box costs more but may still be better value."], ["Grams in the box", "Size alone ignores the price."]] },
            { p: "Which quantity best compares how **fast** two runners are over different distances?", r: "Metres per second",
              w: [["Time taken", "They ran different distances, so their times can't be compared directly."], ["Distance run", "Distance alone ignores how long it took."]] },
            { p: "Which unit is most sensible for the **length of a pencil**?", r: "Centimetres",
              w: [["Kilometres", "A pencil is about $0.00015$ km — a very awkward number."], ["Metres per second", "That's a speed, not a length."]] },
            { p: "Which unit is most sensible for the **distance between two cities**?", r: "Kilometres",
              w: [["Centimetres", "Tens of millions of centimetres is an awkward number."], ["Square kilometres", "That measures an area, not a distance."]] },
            { p: "Which unit is most sensible for **how much water a bathtub holds**?", r: "Litres",
              w: [["Millilitres", "Around $150\\,000$ mL is a clumsy number for a bathtub."], ["Metres", "Metres measure length, not how much a tub holds."]] },
            { p: "Which unit best describes **how fast a phone downloads**?", r: "Megabytes per second",
              w: [["Megabytes", "That's an amount of data, not how fast it arrives."], ["Seconds", "A time alone doesn't say how much was downloaded."]] },
            { p: "Which quantity best compares the **pay** of two part-time jobs with different hours?", r: "Dollars per hour",
              w: [["Dollars per week", "Different hours make weekly pay an unfair comparison."], ["Hours per week", "That says how long you work, not how well it pays."]] }]);
          return mc(R, { prompt: B.p, right: B.r, wrong: B.w.map(function (x) { return { t: x[0], fb: x[1] }; }),
            hints: ["A fair comparison usually divides one quantity by another — a rate.", "Pick units that give numbers of a sensible size."],
            why: B.r + " answers the question directly and gives numbers of a sensible size." });
        } },
      { id: "a3-formula", title: "Formulas and units", lesson: 2,
        gen: function (R) {
          if (R.chance(0.45)) {
            var F = R.pick([
              { f: "d = \\frac{m}{V}", what: "density $d$", ins: "mass $m$ in grams and volume $V$ in cm³", r: "$\\text{g/cm}^3$", w: [["$\\text{g} \\cdot \\text{cm}^3$", "The formula divides, so the units divide."], ["$\\text{cm}^3\\text{/g}$", "That's volume over mass — upside down."]] },
              { f: "s = \\frac{d}{t}", what: "speed $s$", ins: "distance $d$ in metres and time $t$ in seconds", r: "$\\text{m/s}$", w: [["$\\text{m} \\cdot \\text{s}$", "Speed divides distance by time."], ["$\\text{s/m}$", "Upside down: distance goes on top."]] },
              { f: "A = lw", what: "area $A$", ins: "length $l$ and width $w$ both in feet", r: "$\\text{ft}^2$", w: [["$\\text{ft}$", "Feet times feet is square feet."], ["$\\text{ft}^3$", "Only two lengths are multiplied, not three."]] },
              { f: "V = lwh", what: "volume $V$", ins: "all three lengths in centimetres", r: "$\\text{cm}^3$", w: [["$\\text{cm}^2$", "Three lengths multiply, so the unit is cubed."], ["$\\text{cm}$", "cm × cm × cm isn't cm."]] },
              { f: "P = \\frac{F}{A}", what: "pressure $P$", ins: "force $F$ in newtons (N) and area $A$ in m²", r: "$\\text{N/m}^2$", w: [["$\\text{N} \\cdot \\text{m}^2$", "The formula divides force by area."], ["$\\text{m}^2\\text{/N}$", "Upside down: force goes on top."]] },
              { f: "E = rt", what: "earnings $E$", ins: "pay rate $r$ in dollars per hour and time $t$ in hours", r: "dollars", w: [["dollars per hour", "The hours cancel: $\\frac{\\$}{\\text{h}} \\times \\text{h}$."], ["hours", "Multiplying a pay rate by time gives money."]] },
              { f: "Q = \\frac{V}{t}", what: "flow rate $Q$", ins: "volume $V$ in litres and time $t$ in minutes", r: "litres per minute", w: [["litres × minutes", "The formula divides volume by time."], ["minutes per litre", "Upside down."]] }]);
            return mc(R, { prompt: "In the formula $" + F.f + "$, " + F.what + " is found from " + F.ins + ". What are the units of " + F.what + "?",
              right: F.r, wrong: F.w.map(function (x) { return { t: x[0], fb: x[1] }; }),
              hints: ["Do to the units exactly what the formula does to the numbers."],
              why: "Following the formula through with units gives " + F.r + "." });
          }
          var K = R.pick([
            function () { var l = R.int(5, 25), w = R.int(3, 12), h = R.pick([1, 1.5, 2]); return { p: "A pool is $" + l + "$ m long, $" + w + "$ m wide and $" + num(h) + "$ m deep. What is its volume?", a: l * w * h, u: "m³", why: l + " \\times " + w + " \\times " + num(h) + " = " + num(l * w * h) + "\\text{ m}^3" }; },
            function () { var v = R.int(5, 40), m = v * R.pick([2, 3, 4, 1.5, 0.5]); return { p: "A block has a mass of $" + m + "$ g and a volume of $" + v + "$ cm³. What is its density, in g/cm³?", a: m / v, u: "g/cm³", why: "\\frac{" + m + "\\text{ g}}{" + v + "\\text{ cm}^3} = " + num(m / v) + "\\text{ g/cm}^3" }; },
            function () { var r = R.pick([12, 14, 15, 16, 18, 20]), t = R.int(6, 30); return { p: "Sam earns \\$" + r + " an hour and works $" + t + "$ hours. How much does Sam earn, in dollars?", a: r * t, u: "dollars", why: "\\frac{\\$" + r + "}{1\\text{ h}} \\times " + t + "\\text{ h} = \\$" + r * t }; },
            function () { var d = R.int(4, 20) * 60, t = R.pick([2, 3, 4, 5, 6]); return { p: "A drone flies $" + d + "$ m in $" + t + "$ minutes. What is its speed in metres per minute?", a: d / t, u: "m/min", why: "\\frac{" + d + "\\text{ m}}{" + t + "\\text{ min}} = " + num(d / t) + "\\text{ m/min}" }; }])();
          return { type: "num", prompt: K.p, answer: r6(K.a), post: K.u,
            hints: ["Put the numbers into the formula, units and all."], why: "$" + K.why + "$." };
        } },
      { id: "a3-units", title: "Using units to solve problems", lesson: 3,
        gen: function (R) {
          var T = R.pick([
            function () { var m = R.int(2, 8), r = R.pick([10, 12, 15, 20, 25]), h = R.int(3, 10);
              return { p: "Each machine in a factory makes $" + r + "$ parts an hour. How many parts do $" + m + "$ machines make in $" + h + "$ hours?", a: m * r * h, u: "parts",
                chain: m + "\\text{ machines} \\times \\frac{" + r + "\\text{ parts}}{1\\text{ machine} \\cdot \\text{h}} \\times " + h + "\\text{ h}",
                near: [{ v: r * h, fb: "That's one machine. There are " + m + "." }, { v: m * r, fb: "That's one hour. The machines run for " + h + "." }] }; },
            function () { var mpg = R.pick([25, 30, 32, 40]), gal = R.int(6, 20), d = mpg * gal, c = R.pick([3, 3.5, 4, 2.5]);
              return { p: "A car goes $" + mpg + "$ miles per gallon, and fuel costs \\$" + money(c) + " per gallon. What does the fuel for a $" + d + "$-mile trip cost, in dollars?", a: gal * c, u: "dollars",
                chain: d + "\\text{ mi} \\times \\frac{1\\text{ gal}}{" + mpg + "\\text{ mi}} \\times \\frac{\\$" + money(c) + "}{1\\text{ gal}}",
                near: [{ v: gal, fb: "That's the gallons. Each costs \\$" + money(c) + "." }] }; },
            function () { var kg = R.int(10, 40), lb = r6(kg * 2.2), dose = R.pick([5, 10, 15, 20]);
              return { p: "A dose is $" + dose + "$ mg per kilogram of body weight. A patient weighs $" + num(lb) + "$ pounds, and $1$ kg $= 2.2$ lb. How many mg should they get?", a: kg * dose, u: "mg",
                chain: num(lb) + "\\text{ lb} \\times \\frac{1\\text{ kg}}{2.2\\text{ lb}} \\times \\frac{" + dose + "\\text{ mg}}{1\\text{ kg}}",
                near: [{ v: r6(lb * dose), fb: "The dose is per **kilogram**: turn the pounds into kilograms first." }, { v: kg, fb: "That's the weight in kg. Each kg needs " + dose + " mg." }] }; },
            function () { var cover = R.pick([8, 10, 12]), coats = R.pick([1, 2]), litres = R.int(2, 9), area = litres * cover / coats;
              return { p: "One litre of paint covers $" + cover + "$ m². How many litres are needed for " + (coats === 2 ? "two coats on " : "") + "a wall of $" + num(area) + "$ m²?", a: litres, u: "litres",
                chain: (coats === 2 ? "2 \\times " : "") + num(area) + "\\text{ m}^2 \\times \\frac{1\\text{ L}}{" + cover + "\\text{ m}^2}",
                near: [{ v: area * cover * coats, fb: "The m² don't cancel that way. Divide by " + cover + " m² per litre." }] }; },
            function () { var wpm = R.pick([40, 45, 50, 60, 75]), mins = R.int(4, 30), words = wpm * mins;
              return { p: "Ana types $" + wpm + "$ words per minute. How many minutes will a $" + words + "$-word essay take?", a: mins, u: "minutes",
                chain: words + "\\text{ words} \\times \\frac{1\\text{ min}}{" + wpm + "\\text{ words}}",
                near: [{ v: words * wpm, fb: "Words times words-per-minute doesn't cancel. Put words on the bottom." }] }; },
            function () { var lpm = R.pick([6, 8, 9, 12]), days = R.int(2, 7), mins = R.pick([5, 10, 15]);
              return { p: "A shower uses $" + lpm + "$ litres a minute. Priya showers for $" + mins + "$ minutes a day. How many litres is that over $" + days + "$ days?", a: lpm * mins * days, u: "litres",
                chain: days + "\\text{ days} \\times \\frac{" + mins + "\\text{ min}}{1\\text{ day}} \\times \\frac{" + lpm + "\\text{ L}}{1\\text{ min}}",
                near: [{ v: lpm * mins, fb: "That's one day. There are " + days + "." }] }; }])();
          var near = (T.near || []).filter(function (z) { return Math.abs(z.v - T.a) > 1e-9; });
          return { type: "num", prompt: T.p, answer: r6(T.a), post: T.u, near: near,
            hints: ["Write each rate as a fraction with its units.", "Chain them so every unit but " + T.u + " cancels: $" + T.chain + "$."],
            why: "$" + T.chain + " = " + num(r6(T.a)) + "$ " + T.u + "." };
        } }
    ]
  });
})();
