/* ==========================================================================
   OEdu Lab — the philosophy kit. See lab/core.js (COURSE_KIT) and lab/widgets.js.

   Loaded after the manipulatives, the history kit (its reading pages, cards and
   timelines) and the concept builder, and before any Introduction to Philosophy
   unit. Every scene here is a step kind like the math ones: it returns
   { el, ready, check, reveal } and runs as a problem or, on an idea card, as
   something to explore.

     pwalk       a worked example in words, a line at a time, with a method rail
     pguided     the example the student writes, one step at a time
     pspot       find the line where the reasoning goes wrong
     argue       sentences to sort into reasons, claim and neither; the argument is then set out in order
     zoom        slide between the table you see and the table science describes
     coherence   a jar for beliefs that tells you whether they could all be true at once
     thought     a case with two switches: try every combination and see which detail your verdict depends on
     equilibrium a rule, some cases, and the back-and-forth that makes them agree
     dialogue    a conversation where you ask the questions and the other person finds the problem themself
   Everything the unit needs is on L.P; the history kit's helpers stay on L.H.

   Built from the philosophy build folder (kit/*.js) by assemble.py.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_LAB || !window.OPLO_CHALLENGE || !window.OPLO_LAB.H) return;

  /* =============================================================== Parts
     What every philosophy scene is built from: the lab's own helpers, the
     history kit's reading pages and pictures (L.H), a style sheet of this
     kit's own, and the unit's photographs. Everything is kept on L.P, so this
     kit never replaces what the other kits put on L.

     The one colour rule of the unit, the way Algebra I keeps a like term in
     one colour down every line: a REASON is always blue, a CLAIM (what the
     reasons are for) is always orange, an OBJECTION or counterexample is red,
     and a QUESTION is purple. The colours come from the lab's tokens, so they
     read the same on the dark and the light look. */
  var LAB = window.OPLO_LAB, CH = window.OPLO_CHALLENGE, H = LAB.H;
  var el = LAB.el, esc = LAB.esc, button = LAB.button, fmt = LAB.fmt;
  var P = {};

  /* ----------------------------------------------------------------- Style */
  var styleEl = null;
  function css(text) {
    if (!styleEl) {
      var old = document.getElementById("philkit-css");
      if (old) old.parentNode.removeChild(old);
      styleEl = document.createElement("style");
      styleEl.id = "philkit-css";
      document.head.appendChild(styleEl);
    }
    styleEl.appendChild(document.createTextNode(text));
  }
  function reduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }

  /* ----------------------------------------------------------------- Roles
     role("reason") → the colour token and the word on its chip. */
  var ROLES = {
    reason:    { c: "var(--lw-blue)",   w: "Reason" },
    claim:     { c: "var(--lw-orange)", w: "Claim" },
    objection: { c: "var(--lw-red)",    w: "Objection" },
    question:  { c: "var(--lw-purple)", w: "Question" },
    answer:    { c: "var(--lw-green)",  w: "Answer" },
    look:      { c: "var(--lw-green)",  w: "How it looks" },
    sci:       { c: "var(--lw-yellow)", w: "Science" },
    name:      { c: "var(--lw-purple)", w: "Name" },
    pred:      { c: "var(--lw-green)",  w: "Predicate" },
    aside:     { c: "var(--ink-3)",     w: "Aside" }
  };
  // A small coloured word: chip("reason") → <span class="pk-chip r-reason">Reason</span>; chip("reason", "Reason 2") to rename.
  function chip(role, word) {
    var r = ROLES[role] || ROLES.aside;
    return '<span class="pk-chip r-' + (ROLES[role] ? role : "aside") + '">' + esc(word || r.w) + "</span>";
  }
  // A sentence set in its role's colour, for a lesson's text: say(“claim”, “Sam is home.”).
  function say(role, text) { return '<span class="pk-say r-' + (ROLES[role] ? role : "aside") + '">' + text + "</span>"; }

  /* -------------------------------------------------------------- Pictures
     More line pictures for this course, added to the history kit's set (24 x 24,
     drawn in the colour of the text around them). */
  Object.assign(H.ICONS, {
    bubble:   '<path d="M12 3.5a7.5 7.5 0 0 0-4.6 13.4V20l3.4-2.3A7.5 7.5 0 1 0 12 3.5z"/><path d="M10.1 9.6a2 2 0 1 1 3 1.7c-.7.4-1.1.9-1.1 1.7"/><path d="M12 15.6v.2"/>',
    thinker:  '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/><path d="M14.5 6.2a2.2 2.2 0 1 0-2.9 2.6"/>',
    lamp:     '<path d="M9 21h6M10 18h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/><path d="M12 7v3"/>',
    water:    '<path d="M12 3.5c3.2 4.2 5.5 6.9 5.5 10a5.5 5.5 0 0 1-11 0c0-3.1 2.3-5.8 5.5-10z"/>',
    atom:     '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
    numbers:  '<path d="M5 8h14M5 16h14M9.5 4 8 20M16 4l-1.5 16"/>',
    triangle: '<path d="M12 4 3.5 19.5h17z"/><path d="M4 19.5v-4h4"/>',
    rainbow:  '<path d="M3 18a9 9 0 0 1 18 0"/><path d="M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="M10 18a2 2 0 0 1 4 0"/>',
    boat:     '<path d="M3 15h18l-2.5 5h-13z"/><path d="M12 3v12M12 5l6 8h-6"/>',
    hand:     '<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7.5a6.5 6.5 0 0 1-6.5 6.5h-1A6 6 0 0 1 5 14l-.6-3a1.5 1.5 0 0 1 3-.6L8 12"/>',
    gears:    '<circle cx="8.5" cy="9.5" r="3"/><circle cx="16.5" cy="15.5" r="2.4"/><path d="M8.5 4.5v2M8.5 12.5v2M3.5 9.5h2M11.5 9.5h2M16.5 11v1.5M16.5 18.5v1.5M12.5 15.5H14M19 15.5h1.5"/>',
    flask:    '<path d="M9.5 3.5h5M10.5 3.5v6L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5.5-9.5v-6"/><path d="M7.5 15h9"/>',
    fork:     '<path d="M12 21v-8M12 13 6 7M12 13l6-6M6 7V3.5M18 7V3.5"/>',
    branch:   '<circle cx="6" cy="5.5" r="2"/><circle cx="6" cy="18.5" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7.5v9M18 11c0 4-6 3-12 6"/>',
    clash:    '<path d="M5 5 12 12 5 19M19 5 12 12l7 7"/>',
    balance:  '<path d="M12 3.5v16M7 20h10M4 7.5h16"/><path d="M4 7.5 1.8 13a2.7 2.7 0 0 0 4.4 0zM20 7.5 17.8 13a2.7 2.7 0 0 0 4.4 0z"/>',
    puzzle:   '<path d="M9 4h4v2.5a1.5 1.5 0 1 0 3 0V4h4v5h-2.5a1.5 1.5 0 1 0 0 3H20v8H4v-5h2.5a1.5 1.5 0 1 0 0-3H4V4z"/>',
    eye2:     '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.8"/>',
    delphi:   '<path d="M4 20h16M5.5 17h13M7 7.5h10M5 5h14"/><path d="M8.5 7.5V17M12 7.5V17M15.5 7.5V17"/><path d="M12 2.8v.2"/>',
    mask:     '<path d="M4 6c3-1.5 13-1.5 16 0 0 7-2.5 12-8 12S4 13 4 6z"/><path d="M8.5 10h2M13.5 10h2M9 14.5c1.8 1.4 4.2 1.4 6 0"/>',
    wave:     '<path d="M2.5 12c2.2-3 4.5-3 6.7 0s4.5 3 6.7 0 3.4-2.3 5.6-.5"/>',
    sprout:   '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5zM12 14.5c0-3-2.3-5-5.5-5 0 3 2.3 5 5.5 5z"/>',
    headline: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M7 9h10M7 12.5h10M7 16h6"/>',
    sage:     '<circle cx="12" cy="7.5" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/><path d="M9.5 10.5c.8 2.6 4.2 2.6 5 0"/>',
    exit:     '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
    spiral:   '<path d="M12 12a1.5 1.5 0 1 1 1.5 1.5 3 3 0 1 1-3-3 4.5 4.5 0 1 1 4.5 4.5 6 6 0 1 1-6-6"/>'
  });

  /* ---------------------------------------------------------------- Photos
     The unit's photographs, from the textbook (OpenStax, Introduction to
     Philosophy), whose pictures carry their own open licences; the credit is
     shown under every one. */
  var PH_DIR = "media/phil/u01/";
  Object.assign(H.PHOTOS, {
    friends:  { dir: PH_DIR, src: "friends.jpg", w: 1100, h: 504,
                alt: "Four friends sit in a row on a beach with their backs to the camera, looking out at the waves and talking.",
                credit: "“Conversations” by Sagar / Flickr, CC BY 2.0" },
    manu:     { dir: PH_DIR, src: "manu.jpg", w: 656, h: 800,
                alt: "An old Indian painting: a boat pulled by a great fish, carrying a king and six sages over floodwaters, with a serpent coiled round the line.",
                credit: "“Manu and Saptarishi,” unknown artist, late 1700s / Wikimedia Commons, public domain" },
    hanfei:   { dir: PH_DIR, src: "hanfei.jpg", w: 706, h: 800,
                alt: "A painted portrait of Han Feizi: a bearded man in a robe with a cloth tied at his temple, looking sideways.",
                credit: "“Portrait of Han Fei,” unknown artist / Wikimedia Commons, public domain" },
    diogenes: { dir: PH_DIR, src: "diogenes.jpg", w: 620, h: 800,
                alt: "An oval engraving of Diogenes Laërtius, an old man with a long beard and a fur-trimmed cap.",
                credit: "Engraving from a 1688 edition of his book / Wikimedia Commons, public domain" },
    rousseau: { dir: PH_DIR, src: "rousseau.jpg", w: 554, h: 760,
                alt: "An oval portrait engraving of Jean-Jacques Rousseau on a stone base, with his name and birth year carved below.",
                credit: "Portrait by Maurice Quentin de La Tour / New York Public Library, public domain" },
    frege:    { dir: PH_DIR, src: "frege.jpg", w: 592, h: 800,
                alt: "A black-and-white portrait of the young Gottlob Frege, with a full beard and a dark jacket.",
                credit: "“Young Frege,” about 1879 / Wikimedia Commons, public domain" },
    socrates: { dir: PH_DIR, src: "socrates.jpg", w: 600, h: 800,
                alt: "A marble head of Socrates: a bald, bearded man with a broad flat nose and a thoughtful face.",
                credit: "“Head of Socrates, 1st century CE” by Nathan Hughes Hamilton / Flickr, CC BY 2.0" },
    giani:    { dir: PH_DIR, src: "giani.jpg", w: 800, h: 714,
                alt: "A brown ink sketch of four people talking around a table. The handwritten title names Socrates, Pericles, Alcibiades and Aspasia.",
                credit: "Felice Giani / Cooper Hewitt, Smithsonian Design Museum, public domain" }
  });

  /* A figure for a lesson's art or a page: pic("socrates", "caption"). */
  function pic(key, caption, o) { return H.photo(key, caption, o); }

  /* A passage quoted in a prompt, set apart so it never reads as a colour of the argument system:
     q("The lights are on.") → an indented, italic block. It is a <blockquote>, which also tells the
     lab not to split the prompt into sentences, so the words around it go in <p>…</p> yourself. */
  function q(text) { return '<blockquote class="pk-q">' + text + "</blockquote>"; }
  css([
    ".pk-q { display: block; width: fit-content; max-width: min(100%, 600px); margin: 10px auto; padding: 4px 0 4px 16px; border-left: 3px solid var(--ink-3); text-align: left; font-style: italic; font-size: 18px; line-height: 1.5; color: var(--ink); }",
    ".ch-prompt blockquote.pk-q { margin: 12px auto; }"
  ].join("\n"));

  Object.assign(P, {
    q: q, css: css, reduced: reduced, chip: chip, say: say, ROLES: ROLES, pic: pic,
    icon: H.icon, card: H.card, tiles: H.tiles, read: H.read, sample: H.sample, rich: H.rich
  });
  LAB.P = P;

  /* ===================================================== Watch · Together · Flaw
     The three pieces that teach a way of thinking the way the maths lessons
     teach a method (lab/widgets.js: walk, guided, spotline), but for lines of
     words instead of lines of maths.

       pwalk    a worked example, one line at a time, each line with its reason;
                `how` is the method's named steps as a rail, and a row may `ask`
                the student to call the move before it is shown
       pguided  the same method, with new words: the student does each step, one
                choice at a time, and every right answer writes its line on the
                board
       pspot    a piece of reasoning with one bad line: tap the line where it
                first goes wrong

     Rows: { step, t: the line, fig: a picture under the line (P.board), role: "reason" | "claim" | "objection" |
     "question" | "answer", say: why this line, ask: {...}, fig: svg }.
     //: pwalk    a worked example in words, a line at a time, with a method rail
     //: pguided  the example the student writes, one step at a time
     //: pspot    find the line where the reasoning goes wrong */
  P.css([
    ".pk-chip { display: inline-block; margin-right: 8px; padding: 1px 9px; border-radius: 999px; font-family: var(--font); font-size: 11.5px; font-weight: 650; line-height: 1.75; letter-spacing: .06em; text-transform: uppercase; vertical-align: 2px; white-space: nowrap; color: var(--c); background: color-mix(in srgb, var(--c) 15%, transparent); }",
    ".pk-chip.r-reason, .pk-say.r-reason, .pk-l.r-reason { --c: var(--lw-blue); }",
    ".pk-chip.r-claim, .pk-say.r-claim, .pk-l.r-claim { --c: var(--lw-orange); }",
    ".pk-chip.r-objection, .pk-say.r-objection, .pk-l.r-objection { --c: var(--lw-red); }",
    ".pk-chip.r-question, .pk-say.r-question, .pk-l.r-question { --c: var(--lw-purple); }",
    ".pk-chip.r-answer, .pk-say.r-answer, .pk-l.r-answer { --c: var(--lw-green); }",
    ".pk-chip.r-aside, .pk-say.r-aside, .pk-l.r-aside { --c: var(--ink-3); }",
    ".pk-chip.r-look, .pk-say.r-look, .pk-l.r-look { --c: var(--lw-green); }",
    ".pk-chip.r-sci, .pk-say.r-sci, .pk-l.r-sci { --c: var(--lw-yellow); }",
    ".pk-chip.r-name, .pk-say.r-name, .pk-l.r-name { --c: var(--lw-purple); }",
    ".pk-chip.r-pred, .pk-say.r-pred, .pk-l.r-pred { --c: var(--lw-green); }",
    ".pk-say { padding: 0 .18em; border-radius: 4px; background: color-mix(in srgb, var(--c) 17%, transparent); box-shadow: inset 0 -2px 0 var(--c); -webkit-box-decoration-break: clone; box-decoration-break: clone; }",
    /* the board */
    ".pk-wk { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }",
    ".pk-row { display: grid; justify-items: center; gap: 4px; padding: 14px 0; border-top: 1px solid var(--hair); text-align: center; }",
    ".pk-row:first-child { border-top: 0; }",
    ".pk-row.in { animation: ch-drop .3s var(--ease); }",
    ".pk-st { font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--blue); }",
    ".pk-l { max-width: 640px; font-size: 20px; line-height: 1.5; color: var(--ink); }",
    ".pk-l.has-role { padding: 8px 16px 9px; border-radius: 13px; background: color-mix(in srgb, var(--c) 9%, var(--paper)); box-shadow: inset 3px 0 0 var(--c); text-align: left; }",
    ".pk-s { max-width: 600px; font-size: 16px; line-height: 1.5; color: var(--ink-2); }",
    ".pk-l:empty { display: none; } .pk-l:empty + .pk-s { font-size: 17px; color: var(--ink); }",
    ".pk-wk-fig { display: grid; justify-items: center; width: 100%; margin: 8px 0 2px; }",
    ".pk-walk.solved .pk-row:last-child .pk-st, .pk-guided.solved .pk-row:last-child .pk-st { color: var(--lw-green); }",
    "@media (prefers-reduced-motion: reduce) { .pk-row.in { animation: none; } }",
    /* find the flaw */
    ".pk-spot { display: grid; gap: 8px; justify-items: center; }",
    ".pk-spot-l, .pk-spot-fix { display: grid; grid-template-columns: 54px minmax(0, 1fr); align-items: center; gap: 10px; width: min(100%, 640px); padding: 11px 16px; border: 0; border-radius: 14px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); color: var(--ink); font: inherit; text-align: left; cursor: pointer; transition: box-shadow .15s, background-color .15s; }",
    ".pk-spot-l:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px var(--ink-3); }",
    ".pk-spot-l.on { box-shadow: inset 0 0 0 2px var(--blue); background: color-mix(in srgb, var(--blue) 12%, var(--paper)); }",
    ".pk-spot-l.no { box-shadow: inset 0 0 0 2px var(--lw-yellow); }",
    ".pk-spot-l.bad { box-shadow: inset 0 0 0 2px var(--lw-red); background: color-mix(in srgb, var(--lw-red) 12%, var(--paper)); }",
    ".pk-spot-l:disabled { cursor: default; }",
    ".pk-spot-n { font-size: 12px; font-weight: 600; letter-spacing: .04em; color: var(--ink-3); }",
    ".pk-spot-t { font-size: 18px; line-height: 1.45; }",
    ".pk-spot-fix { cursor: default; box-shadow: inset 0 0 0 2px var(--lw-green); background: color-mix(in srgb, var(--lw-green) 12%, var(--paper)); animation: ch-drop .3s var(--ease); }",
    ".pk-spot-fix .pk-spot-n { color: var(--lw-green); }"
  ].join("\n"));

  function howName(h) { return Array.isArray(h) ? h[0] : h; }
  function rail(how) {
    var ol = el("ol", "lw-rail");
    how.forEach(function (h, i) { ol.appendChild(el("li", "", "<b>" + (i + 1) + "</b><span>" + fmt(howName(h)) + "</span>")); });
    return { el: ol, at: function (n, all) {
      [].forEach.call(ol.children, function (li, i) { li.className = all || i + 1 < n ? "done" : i + 1 === n ? "cur" : ""; });
    } };
  }
  /* One line of a worked example. A line that opens a new step of the method says so.
     r.t and r.say have already been formatted by the lab (they are text keys). */
  function row(list, how, r, prev, fresh) {
    var li = el("li", "pk-row" + (fresh ? " in" : ""));
    var st = how && r.step && (!prev || prev.step !== r.step)
      ? '<span class="pk-st">Step ' + r.step + " · " + fmt(howName(how[r.step - 1])) + "</span>" : "";
    var line = r.t != null && r.t !== ""
      ? '<span class="pk-l' + (r.role ? " has-role r-" + r.role : "") + '">' + (r.role ? chip(r.role, r.tag) : "") + r.t + "</span>" : "";
    li.innerHTML = st + line + '<span class="pk-s">' + (r.say || "") + "</span>" + (r.fig ? '<div class="pk-wk-fig">' + r.fig + "</div>" : "");
    list.appendChild(li);
  }

  CH.addKind("pwalk", function (spec, seed, mode) {
    var api = {}, rows = spec.rows || [], k = Math.min(rows.length, spec.start || 1);
    var box = el("div", "lw pk-walk");
    var rl = spec.how ? rail(spec.how) : null;
    if (rl) box.appendChild(rl.el);
    var list = el("ol", "pk-wk");
    box.appendChild(list);
    var go = button("lw-btn lw-wk-next", "Next step");
    var tools = el("div", "lw-tools");
    tools.appendChild(go);
    box.appendChild(tools);
    var ask = el("div", "lw-ask");
    box.appendChild(ask);
    function add(i, fresh) { row(list, spec.how, rows[i], rows[i - 1], fresh); }
    for (var i0 = 0; i0 < k; i0++) add(i0, false);
    function show() { add(k, true); k++; paint(); }
    function quiz() {
      var q = rows[k] && rows[k].ask;
      ask.hidden = !q;
      ask.innerHTML = "";
      if (!q) return;
      ask.appendChild(el("div", "lw-ask-q", q.prompt || "What comes next?"));
      var opts = el("div", "lw-ask-o"), note = el("p", "lw-ask-fb");
      LAB.rng("pask:" + seed + ":" + k).shuffle(q.options.map(function (o, j) { return j; })).forEach(function (j) {
        var o = q.options[j], b = button("lw-btn", typeof o === "string" ? fmt(o) : o.t);
        b.addEventListener("click", function () {
          if (j === q.answer) { show(); return; }
          b.disabled = true;
          b.classList.add("no");
          note.innerHTML = (typeof o !== "string" && o.fb) || "Not that one. Look at the step that's lit and try again.";
        });
        opts.appendChild(b);
      });
      ask.appendChild(opts);
      ask.appendChild(note);
    }
    function paint() {
      var end = k >= rows.length;
      quiz();
      tools.hidden = end || !ask.hidden;
      box.classList.toggle("solved", end);
      if (rl) rl.at(((ask.hidden ? rows[k - 1] : rows[k]) || {}).step, end);
      if (api.onChange) api.onChange();
    }
    go.addEventListener("click", function () {
      if (k >= rows.length) return;
      show();
      if (k < rows.length && !tools.hidden) go.focus();
    });
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? k >= rows.length : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { while (k < rows.length) { add(k, false); k++; } paint(); };
    return api;
  });

  /* The example the student writes. spec: { how, steps: [{ step, ask, type: "choice" | "multi", ...that
     kind's own fields, t, role, say, hint, lead: [{ t, role, say }] }] }. */
  CH.addKind("pguided", function (spec, seed) {
    var api = { helpAt: 1 }, steps = spec.steps || [], k = 0, cur = null, slips = 0;
    var box = el("div", "lw pk-guided");
    var rl = spec.how ? rail(spec.how) : null;
    if (rl) box.appendChild(rl.el);
    var list = el("ol", "pk-wk");
    box.appendChild(list);
    var now = el("div", "lw-now");
    box.appendChild(now);
    function open() {
      var s = steps[k];
      now.innerHTML = "";
      cur = null;
      now.hidden = !s;
      box.classList.toggle("solved", !s);
      if (rl) rl.at(s ? s.step : 0, !s);
      if (!s) return;
      if (spec.how && s.step) now.appendChild(el("p", "lw-now-st", "Step " + s.step + " · " + fmt(howName(spec.how[s.step - 1]))));
      if (s.ask) now.appendChild(el("div", "lw-now-q", s.ask));
      cur = CH.kinds[s.type || "choice"](s, seed + ":" + k, {});
      cur.onChange = function () { if (api.onChange) api.onChange(); };
      cur.onEnter = function () { if (api.onEnter) api.onEnter(); };
      now.appendChild(cur.el);
      if (k && cur.focus) cur.focus();
    }
    function write() {
      var s = steps[k], prev = steps[k - 1];
      (s.lead || []).concat(s).forEach(function (r) {
        row(list, spec.how, { step: s.step, t: r.t, role: r.role, tag: r.tag, say: r.say }, prev, true);
        prev = s;
      });
      k++; open();
    }
    open();
    api.el = box;
    api.ready = function () { return !cur || cur.ready(); };
    api.check = function () {
      if (!cur) return { ok: true, helped: slips > 0 };
      var s = steps[k], r = cur.check();
      if (!r.ok) { slips++; return { ok: false, say: r.say || s.hint || null }; }
      write();
      if (!cur) return { ok: true, helped: slips > 0 };
      return { ok: true, more: true, say: "<b>Right.</b> " + (spec.how && steps[k].step !== s.step ? "On to step " + steps[k].step + "." : "Keep going.") };
    };
    api.reveal = function () {
      if (!cur) return;
      slips++;
      write();
      return cur ? "more" : undefined;
    };
    api.focus = function () { if (cur && cur.focus) cur.focus(); };
    api.sub = function () { return cur; };
    return api;
  });

  /* Find the flaw. spec: { lines: [text], answer: index, fix: text, fb: { index: reply } }. */
  CH.addKind("pspot", function (spec) {
    var api = {}, picked = null, box = el("div", "lw pk-spot");
    var btns = spec.lines.map(function (t, i) {
      var b = button("pk-spot-l", '<span class="pk-spot-n">Line ' + (i + 1) + '</span><span class="pk-spot-t">' + fmt(t) + "</span>");
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (b.disabled) return;
        picked = i;
        btns.forEach(function (c) { c.classList.toggle("on", c === b); c.classList.remove("no"); c.setAttribute("aria-pressed", String(c === b)); });
        api.onChange();
      });
      box.appendChild(b);
      return b;
    });
    function found() {
      btns.forEach(function (c, i) { c.disabled = true; c.classList.remove("on", "no"); if (i === spec.answer) c.classList.add("bad"); });
      if (spec.fix != null && !box.querySelector(".pk-spot-fix")) {
        box.insertBefore(el("div", "pk-spot-fix", '<span class="pk-spot-n">Fix</span><span class="pk-spot-t">' + fmt(spec.fix) + "</span>"), btns[spec.answer].nextSibling);
      }
    }
    api.el = box;
    api.ready = function () { return picked != null; };
    api.check = function () {
      if (picked === spec.answer) { found(); return { ok: true }; }
      var fb = spec.fb && spec.fb[picked];
      btns[picked].classList.add("no");
      btns[picked].classList.remove("on");
      picked = null;
      return { ok: false, say: fb ? fmt(fb) : "That line follows from the ones above it. Read each line against the line before." };
    };
    api.reveal = found;
    return api;
  });

  /* ================================================================== Argue
     An argument, taken apart. A short passage comes as separate sentences;
     for each one the student says what it does — a REASON (a premise: offered
     in support), the CLAIM (the conclusion: what the reasons are for) or NEITHER
     (a sentence that is not part of the argument). A right answer sets the
     argument out in order, the way a philosopher writes it: reasons first, a
     line, then "So" and the claim.

       spec: { items: [{ t: sentence, role: "reason" | "claim" | "aside", fb: reply for a wrong role }],
               board: true }          show the argument in order once it is right
       P.board(reasons, claim, o)     the same board as a picture for a lesson's art:
                                      o: { head: "title", tags: ["Reason 1", ...], so: "So" }
     //: argue    sentences to sort into reasons, claim and neither; the argument is then set out in order */
  P.css([
    ".pk-board { display: grid; gap: 8px; width: min(100%, 620px); margin: 0 auto; padding: 16px 18px 18px; border-radius: 18px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); text-align: left; }",
    ".pk-board-h { margin: 0 0 2px; font-size: 12px; font-weight: 650; letter-spacing: .07em; text-transform: uppercase; color: var(--ink-3); text-align: center; }",
    ".pk-b-row { padding: 9px 14px 10px; border-radius: 12px; font-size: 17.5px; line-height: 1.5; color: var(--ink); background: color-mix(in srgb, var(--c) 9%, var(--paper)); box-shadow: inset 3px 0 0 var(--c); }",
    ".pk-b-row.r-reason { --c: var(--lw-blue); } .pk-b-row.r-claim { --c: var(--lw-orange); }",
    ".pk-b-row.r-objection { --c: var(--lw-red); } .pk-b-row.r-question { --c: var(--lw-purple); }",
    ".pk-b-row.r-answer { --c: var(--lw-green); } .pk-b-row.r-aside { --c: var(--ink-3); }",
    ".pk-b-rule { height: 0; border-top: 2px solid var(--ink-3); margin: 2px 0; opacity: .7; }",
    ".pk-board.in .pk-b-row { animation: ch-drop .35s var(--ease) both; }",
    ".pk-board.in .pk-b-row:nth-child(3) { animation-delay: .08s; } .pk-board.in .pk-b-row:nth-child(4) { animation-delay: .16s; }",
    ".pk-board.in .pk-b-row:nth-child(5) { animation-delay: .24s; } .pk-board.in .pk-b-row:nth-child(6) { animation-delay: .32s; }",
    "@media (prefers-reduced-motion: reduce) { .pk-board.in .pk-b-row { animation: none; } }",
    ".pk-ar { display: grid; gap: 10px; justify-items: center; }",
    ".pk-ar-list { display: grid; gap: 10px; width: min(100%, 680px); }",
    ".pk-ar-i { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 4px 12px; align-items: start; padding: 12px 16px 12px 14px; border-radius: 14px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); text-align: left; transition: box-shadow .2s, background-color .2s; }",
    ".pk-ar-i.set { --c: var(--ink-3); background: color-mix(in srgb, var(--c) 8%, var(--paper)); box-shadow: inset 3px 0 0 var(--c), inset 0 0 0 1px var(--hair); }",
    ".pk-ar-i.set.r-reason { --c: var(--lw-blue); } .pk-ar-i.set.r-claim { --c: var(--lw-orange); }",
    ".pk-ar-i.no { box-shadow: inset 0 0 0 2px var(--lw-red); animation: pk-shake .38s; }",
    ".pk-ar-i.yes { box-shadow: inset 3px 0 0 var(--c), inset 0 0 0 1px var(--lw-green); }",
    ".pk-ar-n { font-size: 13px; font-weight: 650; color: var(--ink-3); padding-top: 3px; font-variant-numeric: tabular-nums; }",
    ".pk-ar-t { font-size: 18px; line-height: 1.5; color: var(--ink); }",
    ".pk-ar-b { grid-column: 2; display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }",
    ".pk-ar-p { padding: 5px 13px; border: 0; border-radius: 999px; background: transparent; box-shadow: inset 0 0 0 1.5px var(--hair); color: var(--ink-2); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; transition: background-color .15s, box-shadow .15s, color .15s; }",
    ".pk-ar-p:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px var(--ink-3); color: var(--ink); }",
    ".pk-ar-p.r-reason.on { background: color-mix(in srgb, var(--lw-blue) 20%, transparent); box-shadow: inset 0 0 0 2px var(--lw-blue); color: var(--ink); }",
    ".pk-ar-p.r-claim.on { background: color-mix(in srgb, var(--lw-orange) 20%, transparent); box-shadow: inset 0 0 0 2px var(--lw-orange); color: var(--ink); }",
    ".pk-ar-p.r-aside.on { background: color-mix(in srgb, var(--ink-3) 22%, transparent); box-shadow: inset 0 0 0 2px var(--ink-3); color: var(--ink); }",
    ".pk-ar-p:disabled { cursor: default; }",
    ".pk-ar-key { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; font-size: 14px; color: var(--ink-2); }",
    ".pk-ar-key span { display: inline-flex; align-items: center; gap: 6px; }",
    ".pk-ar-key i { width: 10px; height: 10px; border-radius: 3px; background: var(--c); }"
  ].join("\n"));

  /* The standard form, as markup: reasons, a rule, "So", the claim. */
  function board(reasons, claim, o) {
    o = o || {};
    var h = '<div class="pk-board' + (o.fresh ? " in" : "") + '">' + (o.head === false ? "" : '<p class="pk-board-h">' + esc(o.head || "The argument, in order") + "</p>");
    reasons.forEach(function (r, i) {
      var tag = (o.tags && o.tags[i]) || (reasons.length > 1 ? "Reason " + (i + 1) : "Reason");
      h += '<div class="pk-b-row r-reason">' + chip("reason", tag) + fmt(r) + "</div>";
    });
    h += '<div class="pk-b-rule"></div><div class="pk-b-row r-claim">' + chip("claim", o.so || "So") + fmt(claim) + "</div></div>";
    return h;
  }
  P.board = board;

  var ROLE_WORD = { reason: "Reason", claim: "Claim", aside: "Neither" };
  CH.addKind("argue", function (spec, seed, mode) {
    var api = {}, items = spec.items || [], pick = items.map(function () { return null; }), done = false;
    var box = el("div", "lw pk-ar");
    var list = el("div", "pk-ar-list");
    var rows = items.map(function (it, i) {
      var r = el("div", "pk-ar-i");
      r.innerHTML = '<span class="pk-ar-n">' + (i + 1) + '</span><span class="pk-ar-t">' + it.t + "</span>";
      var bar = el("div", "pk-ar-b");
      var btns = ["reason", "claim", "aside"].map(function (role) {
        var b = button("pk-ar-p r-" + role, ROLE_WORD[role]);
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          if (done) return;
          pick[i] = role;
          paint(i);
          api.onChange && api.onChange();
        });
        bar.appendChild(b);
        return b;
      });
      r.appendChild(bar);
      list.appendChild(r);
      return { el: r, btns: btns };
    });
    function paint(i) {
      var rw = rows[i];
      rw.el.classList.remove("no", "yes", "r-reason", "r-claim", "r-aside");
      rw.el.classList.toggle("set", !!pick[i]);
      if (pick[i]) rw.el.classList.add("r-" + pick[i]);
      rw.btns.forEach(function (b) {
        var on = b.classList.contains("r-" + pick[i]);
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
      });
    }
    box.appendChild(el("div", "pk-ar-key",
      '<span style="--c:var(--lw-blue)"><i></i>Reason: offered in support</span><span style="--c:var(--lw-orange)"><i></i>Claim: what the reasons are for</span><span style="--c:var(--ink-3)"><i></i>Neither: not part of the argument</span>'));
    box.appendChild(list);
    var out = el("div", "pk-ar-out");
    box.appendChild(out);
    function finish() {
      done = true;
      rows.forEach(function (rw, i) { rw.btns.forEach(function (b) { b.disabled = true; }); rw.el.classList.add("yes"); });
      if (spec.board !== false) {
        var rs = [], cl = "";
        items.forEach(function (it) { if (it.role === "reason") rs.push(it.t); else if (it.role === "claim" && !cl) cl = it.t; });
        if (rs.length && cl) out.innerHTML = board(rs, cl, { fresh: !reduced() });
      }
    }
    api.el = box;
    api.ready = function () { return pick.every(function (x) { return !!x; }); };
    api.check = function () {
      var wrong = [];
      items.forEach(function (it, i) { if (pick[i] !== it.role) wrong.push(i); });
      rows.forEach(function (rw, i) { rw.el.classList.toggle("no", wrong.indexOf(i) > -1); });
      if (!wrong.length) { finish(); return { ok: true }; }
      var first = items[wrong[0]];
      var n = wrong.length === 1 ? "One sentence is marked wrong." : wrong.length + " sentences are marked wrong.";
      return { ok: false, say: (first.fb ? first.fb + " " : "") + (first.fb ? "" : n) };
    };
    api.reveal = function () {
      items.forEach(function (it, i) { pick[i] = it.role; paint(i); });
      finish();
    };
    return api;
  });

  /* ================================================================== Zoom
     Two pictures of one table. Slide to zoom in: at one end the table is what
     you see and feel (solid, brown, warm, it holds your cup); at the other it
     is what science says (atoms, mostly empty space). Wilfrid Sellars's
     "manifest image" and "scientific image", something to see rather than read.

       spec: { gate }   with gate, Continue's "then" shows once both ends have been seen
     //: zoom     slide between the table you see and the table science describes */
  var S = H.S, svgRoot = H.svgRoot;
  P.css([
    ".pk-zoom { display: grid; gap: 14px; justify-items: center; }",
    ".pk-z-wrap { width: min(100%, 640px); } .pk-zoom .lw-svg { display: block; width: 100%; height: auto; border-radius: 18px; background: var(--lw-surface); }",
    ".pk-z-wood { fill: #b07a45; } .pk-z-wood2 { fill: #8f6034; } .pk-z-mug { fill: #e8eaf0; } .pk-z-steam { stroke: var(--ink-3); fill: none; stroke-width: 2; stroke-linecap: round; opacity: .6; }",
    ".pk-z-grain { fill: none; stroke: #7d5129; stroke-width: 2.2; stroke-linecap: round; opacity: .85; }",
    ".pk-z-fibre { fill: #c99a62; stroke: #7d5129; stroke-width: 1.5; }",
    ".pk-z-atom { fill: var(--lw-blue); } .pk-z-atom.b { fill: var(--lw-orange); } .pk-z-cloud { fill: color-mix(in srgb, var(--lw-blue) 14%, transparent); stroke: color-mix(in srgb, var(--lw-blue) 40%, transparent); stroke-width: 1.2; }",
    ".pk-z-cap { font-size: 15px; font-weight: 600; fill: var(--ink); }",
    ".pk-z-sub { font-size: 13px; fill: var(--ink-2); }",
    ".pk-z-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: min(100%, 640px); }",
    ".pk-z-box { padding: 12px 16px 14px; border-radius: 15px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); opacity: .55; transition: opacity .25s, box-shadow .25s, background-color .25s; text-align: left; }",
    ".pk-z-box.on { opacity: 1; box-shadow: inset 0 0 0 2px var(--c); background: color-mix(in srgb, var(--c) 9%, var(--paper)); }",
    ".pk-z-box b { display: block; margin-bottom: 4px; font-family: var(--font); font-size: 12.5px; font-weight: 650; letter-spacing: .05em; text-transform: uppercase; color: var(--c); }",
    ".pk-z-box span { display: block; font-size: 15.5px; line-height: 1.5; color: var(--ink); }",
    ".pk-z-box.look { --c: var(--lw-green); } .pk-z-box.sci { --c: var(--lw-yellow); }",
    ".pk-zoom .lw-slider { width: min(100%, 560px); } .pk-zoom .lw-sl-val { min-width: 10em; white-space: nowrap; text-align: left; }",
    "@media (max-width: 640px) { .pk-z-row { grid-template-columns: 1fr; } }"
  ].join("\n"));
  CH.addKind("zoom", function (spec, seed, mode) {
    var api = {}, z = 0, seenA = true, seenB = false;
    var box = el("div", "lw pk-zoom");
    var W = 640, Hh = 270, svg = svgRoot(W, Hh, "pk-zsvg");
    svg.setAttribute("aria-label", "A table with a mug on it, shown at three zoom levels: the table as you see it, its wood fibres, and its atoms.");
    var gA = S("g", {}, svg), gB = S("g", {}, svg), gC = S("g", {}, svg);
    // A: the table you see
    S("rect", { x: 130, y: 120, width: 380, height: 30, rx: 6, class: "pk-z-wood" }, gA);
    S("rect", { x: 130, y: 150, width: 380, height: 8, class: "pk-z-wood2" }, gA);
    S("rect", { x: 152, y: 158, width: 22, height: 80, class: "pk-z-wood2" }, gA);
    S("rect", { x: 466, y: 158, width: 22, height: 80, class: "pk-z-wood2" }, gA);
    S("rect", { x: 292, y: 80, width: 50, height: 40, rx: 8, class: "pk-z-mug" }, gA);
    S("path", { d: "M342 90h12a10 10 0 0 1 0 20h-12", fill: "none", stroke: "#e8eaf0", "stroke-width": 6 }, gA);
    S("path", { d: "M308 68c-6-8 6-12 0-20M326 68c-6-8 6-12 0-20", class: "pk-z-steam" }, gA);
    var tA = S("text", { x: W / 2, y: 262, "text-anchor": "middle", class: "pk-z-cap" }, gA);
    tA.textContent = "Solid. Brown. Warm. It holds your mug.";
    // B: the wood
    [140, 166, 192, 218, 244].forEach(function (y, i) {
      S("path", { d: "M70 " + y + " C160 " + (y - 16 - i * 2) + " 240 " + (y + 14) + " 330 " + y + " S 500 " + (y - 12) + " 570 " + (y + 4), class: "pk-z-grain" }, gB);
    });
    for (var i = 0; i < 5; i++) S("ellipse", { cx: 150 + i * 85, cy: 150 + (i % 2) * 36, rx: 24, ry: 11, class: "pk-z-fibre" }, gB);
    var tB = S("text", { x: W / 2, y: 262, "text-anchor": "middle", class: "pk-z-cap" }, gB);
    tB.textContent = "Closer: a tangle of fibres and tiny cells.";
    // C: the atoms: tiny nuclei in faint clouds, with a great deal of empty space between
    var cols = 7, rows = 3, gx = 80, gy = 62, ox = 62, oy = 54, pts = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) pts.push({ x: ox + c * gx + (r % 2) * 40, y: oy + r * gy, i: r * cols + c });
    pts.forEach(function (p) {
      S("circle", { cx: p.x, cy: p.y, r: 26, class: "pk-z-cloud" }, gC);
    });
    pts.forEach(function (p) { S("circle", { cx: p.x, cy: p.y, r: 4.5, class: "pk-z-atom" + ((p.i + Math.floor(p.i / cols)) % 3 === 0 ? " b" : "") }, gC); });
    var tC = S("text", { x: W / 2, y: 262, "text-anchor": "middle", class: "pk-z-cap" }, gC);
    tC.textContent = "Closest: atoms, tiny nuclei in clouds that are mostly empty space.";
    var wrap = el("div", "pk-z-wrap");
    wrap.appendChild(svg);
    box.appendChild(wrap);

    var look = el("div", "pk-z-box look", "<b>How it looks and feels</b><span>Solid, brown and warm. It holds a mug without a wobble.</span>");
    var sci = el("div", "pk-z-box sci", "<b>What science says</b><span>Atoms held together by forces, with mostly empty space between and inside them.</span>");
    var row = el("div", "pk-z-row");
    row.appendChild(look); row.appendChild(sci);
    box.appendChild(row);

    var sl = H.slider("Zoom in", { min: 0, max: 100, step: 1, v: 0, show: function (v) { return v < 34 ? "what you see" : v < 67 ? "closer" : "what science says"; } }, set);
    box.appendChild(sl.el);

    function ramp(v, a, b) { return Math.max(0, Math.min(1, (v - a) / (b - a))); }
    function set(v) {
      z = v / 100;
      var a = 1 - ramp(z, 0.18, 0.45), cc = ramp(z, 0.55, 0.82);
      var b = Math.min(ramp(z, 0.18, 0.4), 1 - ramp(z, 0.6, 0.82));
      gA.setAttribute("opacity", a); gB.setAttribute("opacity", b); gC.setAttribute("opacity", cc);
      var k = 1 + z * 0.05;
      [gA, gB, gC].forEach(function (g) { g.setAttribute("transform", "translate(" + (W / 2) * (1 - k) + "," + (Hh / 2) * (1 - k) + ") scale(" + k + ")"); });
      // captions stay put: undo the scale on the text rows
      look.classList.toggle("on", z < 0.5);
      sci.classList.toggle("on", z >= 0.5);
      if (z <= 0.1) seenA = true;
      if (z >= 0.9) seenB = true;
      if (api.onChange) api.onChange();
    }
    set(0);
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? seenA && seenB : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { seenA = seenB = true; sl.set(100); set(100); };
    return api;
  });

  /* ============================================================= Coherence
     The belief jar. A person holds several beliefs; some of them cannot all
     be true together. Tap a belief to put it in the jar, tap it again to take
     it out. The jar says at once whether everything inside could be true at
     the same time, and if not, which beliefs clash. The job: keep as many as
     you can without a clash — which means giving something up.

       spec: { beliefs: [text], clashes: [[i, j, k], …], goal: how many must fit,
               who: "Mia's beliefs", gate }
     A clash is a set of beliefs that cannot all be true together; it may be two
     beliefs or three (no two of three may clash on their own).
     //: coherence  a jar for beliefs that tells you whether they could all be true at once */
  P.css([
    ".pk-co { display: grid; gap: 12px; width: min(100%, 720px); justify-items: stretch; }",
    ".pk-co-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }",
    ".pk-co-h { margin: 0 0 8px; font-size: 12px; font-weight: 650; letter-spacing: .07em; text-transform: uppercase; color: var(--ink-3); text-align: center; }",
    ".pk-co-list { display: grid; gap: 8px; min-height: 60px; align-content: start; }",
    ".pk-co-jar { padding: 12px; border-radius: 20px; background: color-mix(in srgb, var(--ink-3) 7%, var(--paper)); box-shadow: inset 0 0 0 2px var(--hair); transition: box-shadow .25s, background-color .25s; }",
    ".pk-co-jar.ok { box-shadow: inset 0 0 0 2px var(--lw-green); background: color-mix(in srgb, var(--lw-green) 8%, var(--paper)); }",
    ".pk-co-jar.bad { box-shadow: inset 0 0 0 2px var(--lw-red); background: color-mix(in srgb, var(--lw-red) 8%, var(--paper)); }",
    ".pk-co-b { display: block; width: 100%; padding: 10px 14px; border: 0; border-radius: 13px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); color: var(--ink); font: inherit; font-size: 16px; line-height: 1.45; text-align: left; cursor: pointer; transition: box-shadow .15s, transform .12s, background-color .15s; }",
    ".pk-co-b:hover { box-shadow: inset 0 0 0 1.5px var(--ink-3); transform: translateY(-1px); }",
    ".pk-co-b.in { background: color-mix(in srgb, var(--lw-blue) 10%, var(--paper)); box-shadow: inset 3px 0 0 var(--lw-blue), inset 0 0 0 1px var(--hair); }",
    ".pk-co-b.clash { background: color-mix(in srgb, var(--lw-red) 14%, var(--paper)); box-shadow: inset 0 0 0 2px var(--lw-red); animation: pk-shake .38s; }",
    "@keyframes pk-shake { 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(2px); } }",
    ".pk-co-empty { padding: 18px 8px; font-size: 14.5px; color: var(--ink-3); text-align: center; }",
    ".pk-co-st { min-height: 52px; padding: 11px 16px; border-radius: 14px; font-size: 16px; line-height: 1.45; text-align: center; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); color: var(--ink-2); }",
    ".pk-co-st.ok { color: var(--ink); box-shadow: inset 0 0 0 2px var(--lw-green); background: color-mix(in srgb, var(--lw-green) 10%, var(--paper)); }",
    ".pk-co-st.bad { color: var(--ink); box-shadow: inset 0 0 0 2px var(--lw-red); background: color-mix(in srgb, var(--lw-red) 10%, var(--paper)); }",
    ".pk-co-st b { font-weight: 650; }",
    ".pk-co-note { padding: 10px 16px; border-radius: 13px; font-size: 15px; line-height: 1.5; color: var(--ink); background: color-mix(in srgb, var(--lw-orange) 10%, transparent); text-align: center; }",
    "@media (prefers-reduced-motion: reduce) { .pk-co-b.clash { animation: none; } }"
  ].join("\n"));
  CH.addKind("coherence", function (spec, seed, mode) {
    var api = {}, bel = spec.beliefs || [], cl = spec.clashes || [], goal = spec.goal || bel.length - 1;
    var inJar = {}, seenOk = false, seenBad = false, solved = false;
    var box = el("div", "lw pk-co");
    if (spec.who) box.appendChild(el("p", "pk-co-h", esc(spec.who)));
    var cols = el("div", "pk-co-cols");
    var shelfW = el("div", ""), jarW = el("div", "");
    shelfW.appendChild(el("p", "pk-co-h", "Beliefs"));
    jarW.appendChild(el("p", "pk-co-h", "The jar"));
    var shelf = el("div", "pk-co-list"), jar = el("div", "pk-co-list pk-co-jar");
    shelfW.appendChild(shelf); jarW.appendChild(jar);
    cols.appendChild(shelfW); cols.appendChild(jarW);
    box.appendChild(cols);
    var st = el("div", "pk-co-st");
    st.setAttribute("role", "status");
    box.appendChild(st);
    var after = el("div", "pk-co-after");
    box.appendChild(after);
    var btns = bel.map(function (t, i) {
      var b = button("pk-co-b", t);
      b.addEventListener("click", function () {
        if (solved) return;
        if (inJar[i]) delete inJar[i]; else inJar[i] = true;
        paint(true);
      });
      return b;
    });
    function members() { return Object.keys(inJar).map(Number).sort(function (a, b) { return a - b; }); }
    function clashing(set) {
      for (var c = 0; c < cl.length; c++) if (cl[c].every(function (i) { return set.indexOf(i) > -1; })) return cl[c];
      return null;
    }
    function paint(interactive) {
      var set = members(), bad = clashing(set);
      shelf.innerHTML = ""; jar.innerHTML = "";
      btns.forEach(function (b, i) {
        b.classList.toggle("in", !!inJar[i]);
        b.classList.toggle("clash", !!(bad && bad.indexOf(i) > -1));
        b.setAttribute("aria-label", bel[i].replace(/<[^>]+>/g, "") + (inJar[i] ? " — in the jar. Press to take it out." : " — press to put it in the jar."));
        (inJar[i] ? jar : shelf).appendChild(b);
      });
      if (!shelf.children.length) shelf.appendChild(el("div", "pk-co-empty", "Everything is in the jar."));
      if (!jar.children.length) jar.appendChild(el("div", "pk-co-empty", "Tap a belief to put it here."));
      jar.classList.toggle("bad", !!bad);
      jar.classList.toggle("ok", !!set.length && !bad);
      st.className = "pk-co-st" + (bad ? " bad" : set.length ? " ok" : "");
      if (bad) { seenBad = true; st.innerHTML = "<b>These can't all be true at once.</b> " + (bad.length === 2 ? "The two marked beliefs contradict each other." : "No two of the marked beliefs clash alone, but all " + bad.length + " together can't be true."); }
      else if (set.length) { seenOk = true; st.innerHTML = "<b>Coherent.</b> These " + (set.length === 1 ? "belief" : set.length + " beliefs") + " could all be true at the same time."; }
      else st.textContent = "Put beliefs in the jar. It tells you whether they could all be true together.";
      if (interactive && api.onChange) api.onChange();
    }
    // Every coherent set of the goal's size, to know how many fixes there are and to show one.
    function fixes() {
      var out = [], n = bel.length;
      for (var m = 0; m < (1 << n); m++) {
        var s = [], k;
        for (k = 0; k < n; k++) if (m & (1 << k)) s.push(k);
        if (s.length === goal && !clashing(s)) out.push(s);
      }
      return out;
    }
    function finish() {
      solved = true;
      btns.forEach(function (b) { b.disabled = true; });
      var set = members(), gave = bel.map(function (t, i) { return i; }).filter(function (i) { return set.indexOf(i) < 0; });
      var many = fixes().length > 1;
      after.innerHTML = '<div class="pk-co-note">You kept ' + set.length + " and gave up " + (gave.length === 1 ? "this one" : "these") + ": <b>" + gave.map(function (i) { return bel[i].replace(/[.]$/, ""); }).join("</b>; <b>") + "</b>." +
        (many ? " That wasn't the only way to fix it. Which belief to give up depends on which you have the weakest reasons for." : "") + "</div>";
    }
    paint(false);
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? seenOk && seenBad : members().length > 0; };
    api.check = function () {
      var set = members(), bad = clashing(set);
      if (bad) return { ok: false, say: "The jar still has beliefs that can't all be true together: they're marked in red. Take one out." };
      if (set.length < goal) return { ok: false, say: "No clash — but you've given up more than you need to. Can you fit " + (goal - set.length === 1 ? "one more" : (goal - set.length) + " more") + " in without a clash?" };
      finish();
      return { ok: true };
    };
    api.reveal = function () {
      var f = fixes()[0] || [];
      inJar = {};
      f.forEach(function (i) { inJar[i] = true; });
      seenOk = seenBad = true;
      paint(false);
      finish();
    };
    return api;
  });

  /* ============================================================== Thought
     A thought experiment you can run. A short case has two details you can
     switch. For each of the four combinations you give your verdict, and the
     table fills in, so you can see which detail your answer really depends on:
     the one thing that, when changed, flips your verdict.

       spec: { tpl: "A friend lent you her bat for {1}. She needs it for {0}.",
               switches: [{ name: "She needs it for", a: "practice", b: "hitting someone" },
                          { name: "You've had it for", a: "a week", b: "a year" }],
               ask: "Should you give it back?", verdicts: ["Yes", "No", "Not sure"], gate }
     {0} and {1} are filled in with the chosen detail of each switch.
     //: thought   a case with two switches: try every combination and see which detail your verdict depends on */
  P.css([
    ".pk-th { display: grid; gap: 14px; width: min(100%, 680px); justify-items: stretch; }",
    ".pk-th-story { padding: 16px 20px; border-radius: 16px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); font-size: 18.5px; line-height: 1.55; color: var(--ink); text-align: left; }",
    ".pk-th-story b { font-weight: 650; padding: 0 .15em; border-radius: 4px; background: color-mix(in srgb, var(--lw-orange) 18%, transparent); box-shadow: inset 0 -2px 0 var(--lw-orange); }",
    ".pk-th-sw { display: grid; gap: 12px; }",
    ".pk-th-row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px 14px; }",
    ".pk-th-name { font-size: 15px; color: var(--ink-2); }",
    ".pk-th-seg { display: inline-flex; gap: 6px; flex-wrap: wrap; }",
    ".pk-th-q { margin: 2px 0 0; font-family: var(--font); font-size: 17px; font-weight: 600; color: var(--ink); text-align: center; }",
    ".pk-th-v { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }",
    ".pk-th-v .lw-btn.on { box-shadow: inset 0 0 0 2px var(--blue); background: color-mix(in srgb, var(--blue) 14%, var(--paper)); }",
    ".pk-th-cap { margin: 0; font-size: 13.5px; color: var(--ink-3); text-align: center; }",
    ".pk-th-grid { display: grid; grid-template-columns: auto 1fr 1fr; gap: 6px; align-items: stretch; font-size: 14px; }",
    ".pk-th-grid > div { padding: 9px 10px; border-radius: 10px; text-align: center; }",
    ".pk-th-h { color: var(--ink-3); font-weight: 600; font-size: 12.5px; letter-spacing: .03em; display: grid; align-content: center; }",
    ".pk-th-cell { border: 0; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); color: var(--ink-3); font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; transition: box-shadow .15s, background-color .15s; }",
    ".pk-th-cell:hover { box-shadow: inset 0 0 0 1.5px var(--ink-3); }",
    ".pk-th-cell.cur { box-shadow: inset 0 0 0 2px var(--blue); }",
    ".pk-th-cell.v0 { color: var(--ink); background: color-mix(in srgb, var(--lw-green) 16%, var(--paper)); }",
    ".pk-th-cell.v1 { color: var(--ink); background: color-mix(in srgb, var(--lw-red) 16%, var(--paper)); }",
    ".pk-th-cell.v2 { color: var(--ink); background: color-mix(in srgb, var(--ink-3) 16%, var(--paper)); }",
    ".pk-th-ins { padding: 11px 16px; border-radius: 14px; font-size: 16px; line-height: 1.5; color: var(--ink); text-align: center; background: color-mix(in srgb, var(--lw-orange) 10%, transparent); }",
    ".pk-th-ins:empty { display: none; }",
    ".pk-th-ins b { font-weight: 650; }"
  ].join("\n"));
  CH.addKind("thought", function (spec, seed, mode) {
    var api = {}, sw = spec.switches || [], vd = spec.verdicts || ["Yes", "No", "Not sure"], cur = [0, 0], rec = {};
    var box = el("div", "lw pk-th");
    var story = el("div", "pk-th-story");
    box.appendChild(story);
    var swBox = el("div", "pk-th-sw");
    var segs = sw.map(function (s, i) {
      var row = el("div", "pk-th-row");
      row.appendChild(el("div", "pk-th-name", esc(s.name)));
      var seg = el("div", "pk-th-seg"), bs = [s.a, s.b].map(function (t, k) {
        var b = button("lw-btn", t);
        b.addEventListener("click", function () { cur[i] = k; paint(); });
        seg.appendChild(b);
        return b;
      });
      row.appendChild(seg);
      swBox.appendChild(row);
      return bs;
    });
    box.appendChild(swBox);
    box.appendChild(el("p", "pk-th-q", spec.ask || "What is your verdict?"));
    var vbox = el("div", "pk-th-v"), vbs = vd.map(function (v, k) {
      var b = button("lw-btn", v);
      b.addEventListener("click", function () { rec[key()] = k; paint(true); });
      vbox.appendChild(b);
      return b;
    });
    box.appendChild(vbox);
    box.appendChild(el("p", "pk-th-cap", "Your verdicts, one for each case. Across: " + esc(sw[0].name.toLowerCase()) + ". Down: " + esc(sw[1].name.toLowerCase()) + ". Tap a box to see that case."));
    var grid = el("div", "pk-th-grid");
    box.appendChild(grid);
    var ins = el("div", "pk-th-ins");
    ins.setAttribute("role", "status");
    box.appendChild(ins);
    function key() { return cur[0] + "" + cur[1]; }
    function tpl() {
      return String(spec.tpl).replace(/\{(\d)\}/g, function (m, i) { var s = sw[+i]; return "<b>" + (cur[+i] ? s.b : s.a) + "</b>"; });
    }
    function done() { return ["00", "01", "10", "11"].every(function (k) { return rec[k] != null; }); }
    function insight() {
      if (!done()) return "";
      var parts = sw.map(function (s, i) {
        var flips = 0;
        [0, 1].forEach(function (o) {
          var k0 = i === 0 ? "0" + o : o + "0", k1 = i === 0 ? "1" + o : o + "1";
          if (rec[k0] !== rec[k1]) flips++;
        });
        return flips === 0 ? "Changing <b>" + esc(s.name.toLowerCase()) + "</b> never changed your verdict."
          : flips === 2 ? "Changing <b>" + esc(s.name.toLowerCase()) + "</b> changed your verdict both times."
          : "Changing <b>" + esc(s.name.toLowerCase()) + "</b> changed your verdict once.";
      });
      return parts.join("<br>");
    }
    function paint(fromVerdict) {
      story.innerHTML = tpl();
      segs.forEach(function (bs, i) { bs.forEach(function (b, k) { b.classList.toggle("on", cur[i] === k); b.setAttribute("aria-pressed", String(cur[i] === k)); }); });
      vbs.forEach(function (b, k) { b.classList.toggle("on", rec[key()] === k); });
      grid.innerHTML = "";
      grid.appendChild(el("div", ""));
      [0, 1].forEach(function (a) { grid.appendChild(el("div", "pk-th-h", esc(a ? sw[0].b : sw[0].a))); });
      [0, 1].forEach(function (c) {
        grid.appendChild(el("div", "pk-th-h", esc(c ? sw[1].b : sw[1].a)));
        [0, 1].forEach(function (a) {
          var k = a + "" + c, v = rec[k];
          var cell = button("pk-th-cell" + (v != null ? " v" + v : "") + (k === key() ? " cur" : ""), v != null ? esc(vd[v]) : "·");
          cell.addEventListener("click", function () { cur = [a, c]; paint(); });
          cell.setAttribute("aria-label", "Show this case: " + (a ? sw[0].b : sw[0].a) + ", " + (c ? sw[1].b : sw[1].a) + (v != null ? ". Your verdict: " + vd[v] : ""));
          grid.appendChild(cell);
        });
      });
      ins.innerHTML = insight();
      if (fromVerdict && api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? done() : true) : done(); };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { ["00", "01", "10", "11"].forEach(function (k) { if (rec[k] == null) rec[k] = 0; }); paint(true); };
    return api;
  });

  /* ========================================================== Equilibrium
     Reflective equilibrium, as something you do. You hold a rule and a set of
     judgments about particular cases. Where the rule and a judgment disagree,
     something has to give: switch to a better rule, or change the judgment
     (and live with what that means). Go back and forth until they agree.

       spec: { principles: [{ t: "Always keep your promises." }, …],
               cases: [{ t: "case text", judge: 0 | 1, says: [one verdict per principle] }],
               words: ["Keep it", "Break it"], who: "Promises", gate }
     judge is what you feel about the case at the start; says[k] is what principle k
     gives for it (0 or 1, the same two words).
     //: equilibrium  a rule, some cases, and the back-and-forth that makes them agree */
  P.css([
    ".pk-eq { display: grid; gap: 14px; width: min(100%, 720px); justify-items: stretch; }",
    ".pk-eq-h { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .07em; text-transform: uppercase; color: var(--ink-3); text-align: center; }",
    ".pk-eq-rules { display: grid; gap: 8px; }",
    ".pk-eq-rule { display: block; width: 100%; padding: 10px 14px; border: 0; border-radius: 13px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); color: var(--ink); font: inherit; font-size: 16.5px; line-height: 1.45; text-align: left; cursor: pointer; transition: box-shadow .15s, background-color .15s; }",
    ".pk-eq-rule:hover { box-shadow: inset 0 0 0 1.5px var(--ink-3); }",
    ".pk-eq-rule.on { box-shadow: inset 0 0 0 2px var(--blue); background: color-mix(in srgb, var(--blue) 12%, var(--paper)); }",
    ".pk-eq-cases { display: grid; gap: 8px; }",
    ".pk-eq-case { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 10px 12px; align-items: center; padding: 10px 14px; border-radius: 14px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); text-align: left; transition: box-shadow .2s, background-color .2s; }",
    ".pk-eq-case.ok { box-shadow: inset 3px 0 0 var(--lw-green), inset 0 0 0 1px var(--hair); }",
    ".pk-eq-case.no { box-shadow: inset 0 0 0 2px var(--lw-red); background: color-mix(in srgb, var(--lw-red) 9%, var(--paper)); }",
    ".pk-eq-t { font-size: 16px; line-height: 1.45; color: var(--ink); }",
    ".pk-eq-col { display: grid; gap: 3px; justify-items: center; min-width: 96px; }",
    ".pk-eq-col small { font-size: 11px; font-weight: 650; letter-spacing: .05em; text-transform: uppercase; color: var(--ink-3); }",
    ".pk-eq-v { padding: 5px 12px; border-radius: 999px; font-size: 14px; font-weight: 600; white-space: nowrap; color: var(--ink); background: color-mix(in srgb, var(--ink-3) 18%, transparent); border: 0; font-family: inherit; }",
    "button.pk-eq-v { cursor: pointer; box-shadow: inset 0 0 0 1.5px var(--hair); background: transparent; }",
    "button.pk-eq-v:hover { box-shadow: inset 0 0 0 1.5px var(--ink-3); }",
    "button.pk-eq-v.changed { box-shadow: inset 0 0 0 2px var(--lw-orange); background: color-mix(in srgb, var(--lw-orange) 14%, transparent); }",
    ".pk-eq-st { padding: 11px 16px; border-radius: 14px; font-size: 16px; line-height: 1.5; text-align: center; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); color: var(--ink-2); }",
    ".pk-eq-st.ok { color: var(--ink); box-shadow: inset 0 0 0 2px var(--lw-green); background: color-mix(in srgb, var(--lw-green) 10%, var(--paper)); }",
    ".pk-eq-st.no { color: var(--ink); }",
    ".pk-eq-st b { font-weight: 650; }"
  ].join("\n"));
  CH.addKind("equilibrium", function (spec, seed, mode) {
    var api = {}, pr = spec.principles || [], cs = spec.cases || [], words = spec.words || ["Keep it", "Break it"];
    var rule = 0, my = cs.map(function (c) { return c.judge; }), moved = 0, solved = false;
    var box = el("div", "lw pk-eq");
    var rw = el("div", ""); rw.appendChild(el("p", "pk-eq-h", esc(spec.who ? spec.who + " — the rule" : "The rule")));
    var rules = el("div", "pk-eq-rules"); rw.appendChild(rules); box.appendChild(rw);
    var rbs = pr.map(function (p, k) {
      var b = button("pk-eq-rule", p.t);
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { if (solved || rule === k) return; rule = k; moved++; paint(true); });
      rules.appendChild(b);
      return b;
    });
    var cw = el("div", ""); cw.appendChild(el("p", "pk-eq-h", "Cases, and what you think about each"));
    var list = el("div", "pk-eq-cases"); cw.appendChild(list); box.appendChild(cw);
    var rows = cs.map(function (c, i) {
      var r = el("div", "pk-eq-case");
      r.appendChild(el("span", "pk-eq-t", c.t));
      var a = el("span", "pk-eq-col", "<small>The rule says</small>"), says = el("span", "pk-eq-v", "");
      a.appendChild(says);
      var b = el("span", "pk-eq-col", "<small>I think</small>"), mine = button("pk-eq-v", "");
      mine.addEventListener("click", function () { if (solved) return; my[i] = 1 - my[i]; moved++; paint(true); });
      b.appendChild(mine);
      r.appendChild(a); r.appendChild(b);
      list.appendChild(r);
      return { el: r, says: says, mine: mine };
    });
    var st = el("div", "pk-eq-st");
    st.setAttribute("role", "status");
    box.appendChild(st);
    function bad() { var n = 0; cs.forEach(function (c, i) { if (c.says[rule] !== my[i]) n++; }); return n; }
    function flips() { var n = 0; cs.forEach(function (c, i) { if (my[i] !== c.judge) n++; }); return n; }
    function paint(fromUser) {
      rbs.forEach(function (b, k) { b.classList.toggle("on", rule === k); b.setAttribute("aria-pressed", String(rule === k)); });
      rows.forEach(function (r, i) {
        var agree = cs[i].says[rule] === my[i];
        r.el.classList.toggle("ok", agree); r.el.classList.toggle("no", !agree);
        r.says.textContent = words[cs[i].says[rule]];
        r.mine.textContent = words[my[i]];
        r.mine.classList.toggle("changed", my[i] !== cs[i].judge);
        r.mine.setAttribute("aria-label", "What I think about this case: " + words[my[i]] + (my[i] !== cs[i].judge ? " (changed)" : "") + ". Press to change.");
      });
      var n = bad(), f = flips();
      if (!n) {
        solved = true;
        st.className = "pk-eq-st ok";
        st.innerHTML = "<b>Equilibrium.</b> The rule and your judgments about all " + cs.length + " cases now agree." +
          (f ? " You changed " + f + " of your judgments to fit the rule. That's biting the bullet, so ask whether you would really say it." :
               rule !== 0 ? " You changed the rule, and your judgments about the cases stayed. That is the back-and-forth that reflective equilibrium means." : "");
        rbs.forEach(function (b) { b.disabled = true; }); rows.forEach(function (r) { r.mine.disabled = true; });
      } else {
        st.className = "pk-eq-st no";
        st.innerHTML = "<b>" + n + " of " + cs.length + " cases disagree with the rule.</b> Change the rule, or change your mind about a case, then look again.";
      }
      if (fromUser && api.onChange) api.onChange();
    }
    paint(false); solved = false;
    // A start that already agrees would be a trick: leave it unsolved until the student has moved.
    if (!bad()) { solved = false; }
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? solved : true; };
    api.check = function () {
      if (bad()) return { ok: false, say: "Some cases still disagree with the rule. Change the rule, or your mind about a case." };
      return { ok: true };
    };
    api.reveal = function () {
      var best = 0, bn = 99;
      pr.forEach(function (p, k) { var n = 0; cs.forEach(function (c, i) { if (c.says[k] !== c.judge) n++; }); if (n < bn) { bn = n; best = k; } });
      rule = best; my = cs.map(function (c) { return c.judge; });
      paint(true);
    };
    return api;
  });

  /* ============================================================ Dialogue
     A Socratic conversation, with you as the questioner. Someone says what
     they believe. At each turn you choose what to ask; the good questions
     help them examine their own idea, and the others tell them what to think,
     trick them, or wander off. When the right questions have been asked, the
     person sees the problem in their own idea for themselves.

       spec: { partner: "Nico", how: [steps], open: "their first line",
               rounds: [{ step: 1, q: [{ t: "your question", ok: true, say: "their answer" },
                                       { t: "a worse question", ok: false, fb: "why that is not the Socratic move" }] }],
               close: "what they conclude" }
     In a lesson's idea card it plays at once on each tap; as a problem each pick is
     marked with Check, like a guided example.
     //: dialogue  a conversation where you ask the questions and the other person finds the problem themself */
  P.css([
    ".pk-dl { display: grid; gap: 12px; width: min(100%, 700px); justify-items: stretch; }",
    ".pk-dl-chat { display: grid; gap: 10px; padding: 14px; border-radius: 18px; background: color-mix(in srgb, var(--ink-3) 6%, var(--paper)); box-shadow: inset 0 0 0 1px var(--hair); max-height: 440px; overflow-y: auto; }",
    ".pk-bub { display: grid; gap: 2px; max-width: 82%; padding: 9px 14px 10px; border-radius: 16px; font-size: 16.5px; line-height: 1.5; color: var(--ink); text-align: left; animation: ch-drop .3s var(--ease); }",
    ".pk-bub b { font-size: 11.5px; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); }",
    ".pk-bub.them { justify-self: start; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); border-bottom-left-radius: 5px; }",
    ".pk-bub.me { justify-self: end; background: color-mix(in srgb, var(--lw-purple) 18%, var(--paper)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--lw-purple) 45%, transparent); border-bottom-right-radius: 5px; }",
    ".pk-bub.me b { color: var(--lw-purple); }",
    ".pk-bub.end { justify-self: center; max-width: 92%; text-align: center; background: color-mix(in srgb, var(--lw-green) 12%, var(--paper)); box-shadow: inset 0 0 0 1.5px var(--lw-green); }",
    ".pk-dl-q { display: grid; gap: 8px; }",
    ".pk-dl-h { margin: 0; font-size: 12px; font-weight: 650; letter-spacing: .07em; text-transform: uppercase; color: var(--ink-3); text-align: center; }",
    ".pk-dl-o { display: block; width: 100%; padding: 10px 14px; border: 0; border-radius: 13px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--hair); color: var(--ink); font: inherit; font-size: 16px; line-height: 1.45; text-align: left; cursor: pointer; transition: box-shadow .15s, background-color .15s, opacity .15s; }",
    ".pk-dl-o:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px var(--ink-3); }",
    ".pk-dl-o.on { box-shadow: inset 0 0 0 2px var(--lw-purple); background: color-mix(in srgb, var(--lw-purple) 12%, var(--paper)); }",
    ".pk-dl-o.no { opacity: .5; text-decoration: line-through; cursor: default; }",
    ".pk-dl-fb { margin: 0; min-height: 1.4em; font-size: 15px; line-height: 1.45; color: var(--ink-2); text-align: center; }",
    ".pk-dl-go { justify-self: center; }",
    "@media (prefers-reduced-motion: reduce) { .pk-bub { animation: none; } }"
  ].join("\n"));
  CH.addKind("dialogue", function (spec, seed, mode) {
    var api = {}, rounds = spec.rounds || [], k = 0, picked = null, finished = false, name = spec.partner || "Them";
    var explore = !!mode.explore, rl = spec.how ? rail(spec.how) : null;
    var box = el("div", "lw pk-dl");
    if (rl) box.appendChild(rl.el);
    var chat = el("div", "pk-dl-chat");
    chat.setAttribute("role", "log");
    box.appendChild(chat);
    var qBox = el("div", "pk-dl-q");
    box.appendChild(qBox);
    var fb = el("p", "pk-dl-fb");
    fb.setAttribute("role", "status");
    box.appendChild(fb);
    function bub(who, text, cls) {
      var b = el("div", "pk-bub " + (cls || who), "<b>" + esc(who === "me" ? "You (asking)" : who === "them" ? name : "") + "</b><span>" + text + "</span>");
      if (who === "end") b.firstChild.remove();
      chat.appendChild(b);
      chat.scrollTop = chat.scrollHeight;
    }
    bub("them", fmt(spec.open));
    var btns = [];
    function show() {
      qBox.innerHTML = ""; btns = []; picked = null; fb.textContent = "";
      var r = rounds[k];
      if (!r) { finishUp(); return; }
      if (rl) rl.at(r.step || k + 1, false);
      qBox.appendChild(el("p", "pk-dl-h", "What do you ask?"));
      LAB.rng("dl:" + seed + ":" + k).shuffle(r.q.map(function (o, j) { return j; })).forEach(function (j) {
        var o = r.q[j], b = button("pk-dl-o", o.t);
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          if (finished || b.classList.contains("no")) return;
          picked = j;
          btns.forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
          if (explore) attempt(); else if (api.onChange) api.onChange();
        });
        qBox.appendChild(b);
        btns.push(b);
        b._j = j;
      });
      if (api.onChange) api.onChange();
    }
    function attempt() {
      var r = rounds[k], o = r.q[picked];
      if (!o.ok) {
        var b = btns.filter(function (x) { return x._j === picked; })[0];
        b.classList.remove("on"); b.classList.add("no"); b.disabled = true;
        if (explore) fb.innerHTML = o.fb || "That isn't the Socratic move. Ask something that helps them look at their own idea.";
        picked = null;
        return { ok: false, say: o.fb };
      }
      bub("me", o.t);
      if (o.say) bub("them", o.say);
      k++;
      show();
      return { ok: true };
    }
    function finishUp() {
      finished = true;
      qBox.innerHTML = "";
      if (rl) rl.at(0, true);
      if (spec.close) bub("end", fmt(spec.close), "end");
      if (api.onChange) api.onChange();
    }
    show();
    api.el = box;
    api.helpAt = 1;
    api.ready = function () { return explore && spec.gate ? finished : (finished || picked != null); };
    api.check = function () {
      if (finished) return { ok: true };
      if (picked == null) return { ok: false, say: "Choose a question first." };
      var r = attempt();
      if (!r.ok) return { ok: false, say: r.say || "That isn't the Socratic move. Ask something that helps them look at their own idea." };
      if (finished) return { ok: true };
      return { ok: true, more: true, say: "<b>Good question.</b> Read their answer, then ask the next one." };
    };
    api.reveal = function () {
      if (finished) return;
      var r = rounds[k], j = r.q.map(function (o, i) { return o.ok ? i : -1; }).filter(function (i) { return i >= 0; })[0];
      picked = j;
      var o = r.q[j];
      bub("me", o.t); if (o.say) bub("them", o.say);
      k++; show();
      return finished ? undefined : "more";
    };
    return api;
  });

  window.OPLO_LAB.philkitReady = true;
})();
