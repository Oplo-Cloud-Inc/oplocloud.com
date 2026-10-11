/* ==========================================================================
   Kern — the front door, before sign-in.

   What kern.oplocloud.com shows somebody who is not signed in: a page that
   says what Kern is, the way a good product page does, with one thing to do.

   It is edu.oplocloud.com's welcome page with its middle swapped. The site's
   bar, the chapter bar's place and the site's footer are the ones
   tools/build.py writes into learn/index.html for OEdu, so Kern has the
   same bar every page of oplocloud.com has and cannot drift from it; the
   chapter bar is Kern's own, written by the same build into a <template>.
   Only what sits between them is replaced here.

   app.js still owns the sign-in: #gateGo carries its click handler and #gErr
   is where it writes. Every other "Sign in" is a [data-signin], which
   landing.js hands to app.js, exactly as on the OEdu page. This file never
   touches the network, and nothing on the page is made up: the courses,
   units and pads are read from the same catalogue the app itself draws.

   The page scrolls inside #gate, not the body, as the welcome page always did.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_KERN) return;
  var gate = document.getElementById("gate");
  if (!gate) return;

  var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var ART = window.KERN_ART;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel, root) { return (root || gate).querySelector(sel); }
  function $$(sel, root) { return [].slice.call((root || gate).querySelectorAll(sel)); }

  var CURSOR = '<svg viewBox="0 0 28 34" aria-hidden="true"><path d="M3 2.5v24l6.3-5.8 4.6 10.2 4.4-2-4.5-9.9 8.6-.5z" fill="#0b0b0c" ' +
    'stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5.5 12.5 4.3 4.3L18.5 7.8" fill="none" stroke="currentColor" ' +
    'stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ----------------------------------------------------------------------
     The catalogue, as the app has it: subjects → live courses → units.
     Nothing is typed in here, so the page cannot say a course exists that
     does not. Media Arts is a school's own licensed course, not Kern's, and
     the courses still to be written are left out.
     ---------------------------------------------------------------------- */
  function catalogue() {
    var out = [];
    try {
      window.OPLO_SCHOOL.subjects().forEach(function (s) {
        var cs = s.courses.filter(function (c) { return !c.stub && c.id !== "media" && (c.units || []).length; });
        if (cs.length) out.push({ n: s.n, courses: cs });
      });
    } catch (e) { /* the page still stands without the numbers */ }
    out.sort(function (a, b) { return (b.n === "Math") - (a.n === "Math"); });
    return out;
  }
  var CAT = catalogue();
  var nCourses = 0, nUnits = 0;
  CAT.forEach(function (s) { s.courses.forEach(function (c) { nCourses++; nUnits += c.units.length; }); });

  /* ----------------------------------------------------------------------
     The page.
     ---------------------------------------------------------------------- */
  var NAME = {};
  CAT.forEach(function (s) { s.courses.forEach(function (c) { NAME[c.id] = c; }); });

  function unitCount(n) { return n + (n === 1 ? " unit" : " units"); }

  function pad(art, n, cls) {
    if (!ART) return "";
    var h = ART.pad(art, n);
    return cls ? h.replace('class="kp-pad', 'class="kp-pad ' + cls) : h;
  }

  var facts = [
    { ic: '<path d="M12 3v18M16.5 7.2c-.9-1.4-2.5-2.2-4.5-2.2-2.6 0-4.3 1.2-4.3 3.2 0 4.4 9 2.4 9 7 0 2-1.9 3.3-4.7 3.3-2.1 0-3.8-.9-4.8-2.4" ' +
        'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>', t: "Free", d: "No plan to choose and no card to enter. Just open a course." },
    { ic: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m8.2 12.4 2.6 2.6 5-5.6" ' +
        'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>', t: "Nothing is graded", d: "No marks and no ranks. What you learn here is yours; no one sees it." },
    { ic: '<rect x="4" y="4.5" width="7" height="7" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
        '<rect x="13" y="4.5" width="7" height="7" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
        '<rect x="4" y="13.5" width="7" height="7" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
        '<rect x="13" y="13.5" width="7" height="7" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.7"/>',
      t: nCourses ? nCourses + " courses" : "Courses to start on", d: nUnits ? unitCount(nUnits) + ", from first-grade counting to precalculus." : "From first-grade counting to precalculus." }
  ];

  function factTile(f) {
    return '<div class="kf-fact kf-rise"><svg class="kf-fact-ic" viewBox="0 0 24 24" aria-hidden="true">' + f.ic + "</svg>" +
      '<h2 class="kf-fact-t">' + esc(f.t) + "</h2><p>" + esc(f.d) + "</p></div>";
  }

  // The path in the third row: the first units of a course, as the app draws them.
  function pathMock() {
    var c = NAME.precalc || (CAT[0] && CAT[0].courses[0]);
    var units = c ? c.units.slice(0, 4) : [];
    var rows = units.map(function (u, i) {
      return '<li class="kf-pn' + (i === 0 ? " cur" : "") + '" style="--o:' + [0, 46, 14, -30][i % 4] + '">' +
        pad(u.art, i + 1) + '<span><b>' + esc(u.t) + "</b><em>Unit " + (i + 1) + "</em></span></li>";
    }).join("");
    return '<ol class="kf-path">' + rows + "</ol>";
  }

  function moveCards() {
    var steps = [
      { k: "01", t: "Watch one done", d: "Each idea starts with a worked example, taken one small step at a time, with a picture for every step.",
        tone: "peach", fig:
          '<svg viewBox="0 0 280 140" aria-hidden="true"><path d="M30 96h220" stroke="#0b0b0c" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"/>' +
          '<g stroke="#0b0b0c" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"><path d="M50 90v12M90 90v12M130 90v12M170 90v12M210 90v12"/></g>' +
          '<path d="M50 78C70 36 110 36 130 78" fill="none" stroke="#5468ff" stroke-width="3.2" stroke-linecap="round"/>' +
          '<path d="M130 78C150 36 190 36 210 78" fill="none" stroke="#5468ff" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="2 8"/>' +
          '<circle cx="50" cy="96" r="7" fill="#0b0b0c"/><circle cx="130" cy="96" r="7" fill="#fff" stroke="#0b0b0c" stroke-width="3"/>' +
          '<text x="90" y="44" text-anchor="middle" font-size="15" font-weight="600" fill="#0b0b0c" font-family="Inter,system-ui,sans-serif">+4</text></svg>' },
      { k: "02", t: "Do one together", d: "Then you take the steps, and a hint asks a question instead of handing you the answer.",
        tone: "sage", fig:
          '<svg viewBox="0 0 280 140" aria-hidden="true"><rect x="38" y="30" width="204" height="40" rx="12" fill="#fff"/>' +
          '<text x="58" y="56" font-size="17" font-weight="600" fill="#0b0b0c" font-family="Inter,system-ui,sans-serif">3x + 5 = 20</text>' +
          '<rect x="38" y="82" width="204" height="40" rx="12" fill="#fff" stroke="#5468ff" stroke-width="2.4"/>' +
          '<text x="58" y="108" font-size="17" font-weight="600" fill="#0b0b0c" font-family="Inter,system-ui,sans-serif">3x =</text>' +
          '<rect x="106" y="92" width="52" height="22" rx="7" fill="#e9edfd"/><rect x="198" y="93" width="30" height="20" rx="10" fill="#0b0b0c"/>' +
          '<path d="M207 103h12m-5-5 5 5-5 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
      { k: "03", t: "Do one alone", d: "Last you try it unaided, with nothing to lean on but what you just saw.",
        tone: "mist", fig:
          '<svg viewBox="0 0 280 140" aria-hidden="true"><rect x="58" y="34" width="164" height="72" rx="20" fill="#fff"/>' +
          '<text x="140" y="79" text-anchor="middle" font-size="26" font-weight="600" fill="#0b0b0c" font-family="Inter,system-ui,sans-serif">x = 5</text>' +
          '<circle cx="210" cy="36" r="17" fill="#35c97b"/><path d="m202 36.5 5.4 5.4L218 31" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' }
    ];
    return steps.map(function (s) {
      return '<article class="kf-move kf-rise"><div class="kf-move-fig ' + s.tone + '">' + s.fig + "</div>" +
        '<h3><span>' + s.k + "</span>" + esc(s.t) + "</h3><p>" + esc(s.d) + "</p></article>";
    }).join("");
  }

  function sourceRows() {
    var rows = [
      ["precalc", "OpenStax", "Precalculus 2e"],
      ["alg2", "OpenStax", "Intermediate Algebra 2e"],
      ["alg", "OpenStax", "Algebra 1"],
      ["prealg", "OpenStax", "Prealgebra 2e"],
      ["geo", "CK-12 · Holt", "Geometry"],
      ["g1", "NCERT", "Class 1 Mathematics"],
      ["phil", "OpenStax", "Introduction to Philosophy"]
    ];
    return rows.filter(function (r) { return NAME[r[0]]; }).map(function (r) {
      var c = NAME[r[0]];
      return '<li><span class="src"><b>' + esc(r[1]) + "</b>" + esc(r[2]) + '</span><svg viewBox="0 0 20 20" aria-hidden="true">' +
        '<path d="M3 10h13M12 5.5 16.5 10 12 14.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span class="to"><b>' + esc(c.t) + "</b>" + unitCount(c.units.length) + "</span></li>";
    }).join("");
  }

  var tabs = CAT.map(function (s, i) {
    return '<button class="kf-tab' + (i === 0 ? " on" : "") + '" type="button" role="tab" aria-selected="' + (i === 0) +
      '" data-sub="' + i + '">' + esc(s.n) + "</button>";
  }).join("");

  /* The page between the site's bar and the site's footer. Whatever is not the
     OEdu welcome page that this file expects is left alone. */
  var main = gate.querySelector("main.ld-main");
  var edu = gate.querySelector(".chapter");
  if (!main || !edu || !gate.classList.contains("ld")) return;
  var tpl = document.getElementById("kernChapter");
  var mine = tpl && tpl.content && tpl.content.querySelector(".chapter");
  if (mine) edu.parentNode.replaceChild(document.importNode(mine, true), edu);
  // OEdu's ribbon, its sign-in panel (a second #gateGo would shadow ours) and its film.
  $$(".ld-ribbon, #ldSignin, #ldFilm").forEach(function (n) { n.parentNode.removeChild(n); });
  gate.classList.add("kf");
  main.className = "kf-main";

  main.innerHTML =
    '<div class="kf-top">' +
      '<section class="kf-hero">' +
        '<div class="kf-hero-t">' +
          '<h1 class="kf-rise">Learn<br>by doing.</h1>' +
          '<p class="kf-lede kf-rise">Courses you work through by solving, one small step at a time. No classroom, no grades. Just you and the problem.</p>' +
          '<div class="kf-go kf-rise">' +
            '<button class="kf-btn kf-big kf-kern" type="button" id="gateGo">Get started</button>' +
            '<a class="kf-btn kf-big kf-ghost" href="#kfTeach">See how it works</a>' +
          "</div>" +
          '<p class="kf-note-s">Free. You sign in with an Oplo Account.</p>' +
          '<p class="kf-err" id="gErr" role="alert"></p>' +
        "</div>" +
        '<div class="kf-hero-c kf-rise">' +
          '<div class="kf-card" id="kfCard">' +
            '<div class="kf-card-top"><span class="kf-x" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>' +
              '<span class="kf-segs" aria-hidden="true"><i class="on"></i><i></i><i></i><i></i><i></i></span></div>' +
            '<p class="kf-kick"><b>Explore</b> · Inputs and outputs</p>' +
            '<p class="kf-ask">Drag the dot. Find the two inputs whose output is&nbsp;1.</p>' +
            '<div class="kf-stage" id="kfStage"></div>' +
            '<p class="kf-read"><span>x = <b id="kfX">2</b></span><span>f(x) = <b id="kfY">−1</b></span></p>' +
            '<div class="kf-fb" id="kfFb" aria-live="polite"><p class="kf-fb-idle">Drag the dot along the curve.</p></div>' +
          "</div>" +
        "</div>" +
      "</section>" +
    "</div>" +

    '<section class="kf-facts"><div class="kf-wrap kf-facts-in">' + facts.map(factTile).join("") + "</div></section>" +

    '<section class="kf-teach" id="kfTeach"><div class="kf-wrap">' +
      '<h2 class="kf-h2 kf-rise">Not a lecture.<br>Something to do.</h2>' +
      '<div class="kf-row">' +
        '<div class="kf-row-t kf-rise"><h3>Move it. Watch what changes.</h3>' +
          "<p>Every step asks for one small move: drag a point, build an expression, pick the one that is farthest. You see the idea happen before anyone puts a name on it.</p>" +
          "<p>No paragraphs to wade through. One line to read, one picture, one thing to do.</p></div>" +
        '<div class="kf-panel peach kf-rise"><div class="kf-mini" aria-hidden="true">' +
          '<div class="kf-mini-top"><span class="kf-segs"><i class="on"></i><i class="on"></i><i></i><i></i></span></div>' +
          '<p class="kf-mini-ask">Drag the corner. What do the three angles add up to?</p>' +
          '<div class="kf-mini-stage"><svg viewBox="0 0 260 176" id="kfTri">' +
            '<path id="kfTriShape" d="" fill="rgba(84,104,255,.12)" stroke="#5468ff" stroke-width="3" stroke-linejoin="round"/>' +
            '<circle id="kfTriC" r="9" fill="#5468ff" stroke="#fff" stroke-width="3"/>' +
            '<text id="kfTriA" font-size="13" font-weight="600" fill="#0b0b0c" font-family="Inter,system-ui,sans-serif"></text>' +
            '<text id="kfTriB" font-size="13" font-weight="600" fill="#0b0b0c" font-family="Inter,system-ui,sans-serif" text-anchor="end"></text>' +
            '<text id="kfTriCl" font-size="13" font-weight="600" fill="#0b0b0c" font-family="Inter,system-ui,sans-serif"></text>' +
          "</svg></div>" +
          '<p class="kf-mini-sum">The angles always add to <b>180°</b></p>' +
        "</div></div>" +
      "</div>" +

      '<div class="kf-row flip">' +
        '<div class="kf-panel sage kf-rise"><div class="kf-mini ok" aria-hidden="true">' +
          '<div class="kf-ok"><span class="kf-badge">' + CHECK + "</span><b>That’s it.</b></div>" +
          '<div class="kf-take"><small>Here’s the takeaway</small><p>Two different inputs can have the same output.</p></div>' +
          '<div class="kf-gold"><b>Hmm, think about that again.</b><span>Get a hint</span></div>' +
        "</div></div>" +
        '<div class="kf-row-t kf-rise"><h3>Try it first. Then see why.</h3>' +
          "<p>A new idea begins as something to play with. You make a guess, test it, and are shown what you just found, in a sentence, with your own result beside it.</p>" +
          "<p>Stuck? Ask for a hint. It points you at the next move instead of handing over the answer.</p></div>" +
      "</div>" +

      '<div class="kf-row">' +
        '<div class="kf-row-t kf-rise"><h3>Start anywhere. Nothing is locked.</h3>' +
          "<p>Every course is a path of small pads. Open any one: begin at the first unit, or go straight to the part that has you stuck.</p>" +
          "<p>No deadlines, no marks, and no one watching you work.</p></div>" +
        '<div class="kf-panel oat kf-rise"><div class="kf-mini path" aria-hidden="true">' + pathMock() + "</div></div>" +
      "</div>" +
    "</div></section>" +

    '<section class="kf-moves"><div class="kf-wrap">' +
      '<h2 class="kf-h2 kf-rise">How an idea is taught</h2>' +
      '<div class="kf-moves-in">' + moveCards() + "</div>" +
    "</div></section>" +

    '<section class="kf-courses" id="kfCourses"><div class="kf-wrap">' +
      '<div class="kf-shelf kf-rise">' +
        '<h2 class="kf-h2">Math from first grade to precalculus, and more</h2>' +
        '<div class="kf-tabs" role="tablist" aria-label="Subjects">' + tabs + "</div>" +
        '<div class="kf-shelf-in"><div class="kf-shelf-l"><h3 id="kfSubj"></h3><ul id="kfList"></ul></div>' +
          '<div class="kf-shelf-r" id="kfUnits" aria-live="polite"></div></div>' +
      "</div>" +
    "</div></section>" +

    '<section class="kf-books" id="kfBooks"><div class="kf-wrap kf-row">' +
      '<div class="kf-row-t kf-rise"><h3>Follows a real textbook, a chapter at a time</h3>' +
        "<p>Most courses follow a published book, unit for unit, so what you learn lines up with what school teaches. Then every chapter is rebuilt as things you do.</p>" +
        '<p class="kf-note">Adapted from OpenStax (Rice University), CC BY-NC-SA 4.0. Every question, figure and piece of feedback is our own.</p></div>' +
      '<div class="kf-panel mist kf-rise"><ul class="kf-src">' + sourceRows() + "</ul></div>" +
    "</div></section>" +

    '<section class="kf-final"><div class="kf-final-in">' +
      '<h2 class="kf-rise">Pick a course.<br>Do the first step.</h2>' +
      '<button class="kf-btn kf-big kf-white kf-rise" type="button" data-signin>Get started</button>' +
      '<p class="kf-fine kf-rise">Free. You sign in with an Oplo Account. Your password is typed only at auth.oplocloud.com, in a tab of its own that closes when you are in.</p>' +
    "</div></section>";

  /* ----------------------------------------------------------------------
     Motion: things rise as they arrive.
     ---------------------------------------------------------------------- */
  var io = null;
  if ("IntersectionObserver" in window && !reduced) {
    gate.classList.add("kf-js");
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    // Only once the page can be seen: while the server is still being asked
    // who this is, the page is hidden and a rise would play to nobody.
    var start = function () { $$(".kf-rise").forEach(function (n) { io.observe(n); }); };
    if (gate.classList.contains("ld-wait") && "MutationObserver" in window) {
      var mo = new MutationObserver(function () {
        if (!gate.classList.contains("ld-wait")) { mo.disconnect(); start(); }
      });
      mo.observe(gate, { attributes: true, attributeFilter: ["class"] });
    } else start();
  }

  /* The chapter bar takes the colour of what is under it. landing.js does
     this from the photograph's frame, which this page does not have, so: light
     over the paper, dark while the black closing band is under it. */
  var bar = $(".chapter"), band = $(".kf-final");
  function tint() {
    var edge = bar.getBoundingClientRect().bottom, r = band.getBoundingClientRect();
    gate.classList.toggle("ld-light", !(r.top <= edge + 2 && r.bottom > edge + 2));
  }
  gate.addEventListener("scroll", function () { requestAnimationFrame(tint); }, { passive: true });
  tint();

  /* ----------------------------------------------------------------------
     Courses: a subject's courses on the left, the chosen course's units on
     the right, each with the pad the app gives it.
     ---------------------------------------------------------------------- */
  var curSub = 0, curCourse = null;
  function showCourse(c) {
    curCourse = c.id;
    $$("#kfList button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-c") === c.id)); });
    var units = c.units.slice(0, 12);
    var more = c.units.length - units.length;
    $("#kfUnits").innerHTML =
      '<div class="kf-units-h"><h4>' + esc(c.t) + "</h4><p>" + esc(c.d || "") + "</p></div>" +
      '<ol class="kf-units">' + units.map(function (u, i) {
        return "<li>" + pad(u.art, i + 1, "sm") + "<span>" + esc(u.t) + "</span></li>";
      }).join("") + "</ol>" +
      (more > 0 ? '<p class="kf-more">and ' + unitCount(more).replace(/^(\d+)/, "$1 more") + "</p>" : "");
  }
  function showSubject(i) {
    curSub = i;
    var s = CAT[i];
    if (!s) return;
    $$(".kf-tab").forEach(function (b, j) { b.classList.toggle("on", j === i); b.setAttribute("aria-selected", String(j === i)); });
    $("#kfSubj").textContent = "Courses in " + s.n;
    $("#kfList").innerHTML = s.courses.map(function (c) {
      return '<li><button type="button" data-c="' + esc(c.id) + '" aria-pressed="false"><span>' + esc(c.t) + "</span><em>" + unitCount(c.units.length) + "</em></button></li>";
    }).join("");
    var lead = s.courses.filter(function (c) { return c.id === "precalc"; })[0] || s.courses[s.courses.length - 1];
    showCourse(lead);
  }
  if (CAT.length) {
    showSubject(0);
    gate.addEventListener("click", function (e) {
      var t = e.target.closest(".kf-tab");
      if (t) { showSubject(+t.getAttribute("data-sub")); return; }
      var b = e.target.closest("#kfList button");
      if (b) { var c = NAME[b.getAttribute("data-c")]; if (c) showCourse(c); }
    });
    $(".kf-tabs").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var n = (curSub + (e.key === "ArrowRight" ? 1 : -1) + CAT.length) % CAT.length;
      showSubject(n);
      $$(".kf-tab")[n].focus();
    });
  } else {
    $("#kfCourses").hidden = true;
    $(".kf-books").hidden = true;
  }

  /* ----------------------------------------------------------------------
     The hero: one real step. f(x) is a curve and the question is which two
     inputs give an output of 1. It plays itself until somebody touches it.
     ---------------------------------------------------------------------- */
  (function hero() {
    var stage = $("#kfStage");
    if (!stage) return;
    var NS = "http://www.w3.org/2000/svg";
    var X0 = -1, X1 = 5, Y0 = -2, Y1 = 5;
    var L = 34, R = 20, T = 20, B = 30, W = 360, H = 262;
    var PW = W - L - R, PH = H - T - B;
    function sx(x) { return L + (x - X0) / (X1 - X0) * PW; }
    function sy(y) { return T + (Y1 - y) / (Y1 - Y0) * PH; }
    function f(x) { return 0.5 * (x - 2) * (x - 2) - 1; }
    var GOAL = 1, TARGETS = [0, 4];

    var g = "";
    for (var gx = X0; gx <= X1; gx++) {
      g += '<line class="' + (gx === 0 ? "ax" : "gl") + '" x1="' + sx(gx) + '" y1="' + T + '" x2="' + sx(gx) + '" y2="' + (H - B) + '"/>';
      g += '<text class="tk" x="' + sx(gx) + '" y="' + (H - 10) + '" text-anchor="middle">' + gx + "</text>";
    }
    for (var gy = Y0; gy <= Y1; gy++) {
      g += '<line class="' + (gy === 0 ? "ax" : "gl") + '" x1="' + L + '" y1="' + sy(gy) + '" x2="' + (W - R) + '" y2="' + sy(gy) + '"/>';
      g += '<text class="tk" x="' + (L - 9) + '" y="' + (sy(gy) + 4) + '" text-anchor="end">' + gy + "</text>";
    }
    var d = "";
    for (var i = 0; i <= 90; i++) {
      var x = X0 + (X1 - X0) * i / 90;
      d += (i ? "L" : "M") + sx(x).toFixed(1) + " " + sy(f(x)).toFixed(1);
    }
    stage.innerHTML =
      '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="A curve. Drag the dot along it to change the input x.">' +
        g +
        '<line class="goal" x1="' + L + '" y1="' + sy(GOAL) + '" x2="' + (W - R) + '" y2="' + sy(GOAL) + '"/>' +
        '<g class="goal-tag" transform="translate(' + (sx(2) - 33) + " " + (sy(GOAL) - 30) + ')"><rect width="66" height="21" rx="10.5"/><text x="33" y="14.5" text-anchor="middle">output 1</text></g>' +
        '<path class="curve" d="' + d + '"/>' +
        '<g id="kfFound"></g>' +
        '<line class="guide" id="kfGv"/><line class="guide" id="kfGh"/>' +
        '<g id="kfDot" class="dot" tabindex="0" role="slider" aria-label="Input x" aria-valuemin="-1" aria-valuemax="5" aria-valuenow="2">' +
          '<circle class="halo" r="19"/><circle class="knob" r="10.5"/></g>' +
      "</svg>" +
      '<span class="kf-cursor" id="kfCur" aria-hidden="true">' + CURSOR + "</span>";

    var svg = $("svg", stage), dot = $("#kfDot"), gv = $("#kfGv"), gh = $("#kfGh"), cur = $("#kfCur");
    var xr = $("#kfX"), yr = $("#kfY"), fb = $("#kfFb"), segs = $$(".kf-card-top .kf-segs i");
    var found = {}, xNow = 2, user = false, token = 0, dragging = false;

    function fmt(v) {
      var r = Math.round(v * 10) / 10;
      return (r < 0 ? "−" : "") + Math.abs(r).toFixed(Math.abs(r - Math.round(r)) < 1e-9 ? 0 : 1);
    }
    function place(x) {
      x = Math.max(X0, Math.min(X1, x));
      xNow = x;
      var y = f(x), px = sx(x), py = sy(y);
      dot.setAttribute("transform", "translate(" + px.toFixed(2) + " " + py.toFixed(2) + ")");
      gv.setAttribute("x1", px); gv.setAttribute("x2", px); gv.setAttribute("y1", py); gv.setAttribute("y2", H - B);
      gh.setAttribute("y1", py); gh.setAttribute("y2", py); gh.setAttribute("x1", L); gh.setAttribute("x2", px);
      xr.textContent = fmt(x); yr.textContent = fmt(y);
      dot.setAttribute("aria-valuenow", fmt(x));
      dot.classList.toggle("ok", TARGETS.some(function (t) { return found[t] && Math.abs(x - t) < 0.01; }));
    }
    function svgX(clientX) {
      var r = svg.getBoundingClientRect();
      var px = (clientX - r.left) / r.width * W;
      return X0 + (px - L) / PW * (X1 - X0);
    }
    function feedback(n) {
      if (n === 0) fb.innerHTML = '<p class="kf-fb-idle">Drag the dot along the curve.</p>';
      else if (n === 1) fb.innerHTML = '<div class="kf-fb-ok"><span class="kf-badge">' + CHECK + "</span><p><b>That’s one.</b> There’s another.</p></div>";
      else fb.innerHTML = '<div class="kf-fb-ok"><span class="kf-badge">' + CHECK + "</span><p><b>Two inputs, one output.</b></p></div>" +
        '<button class="kf-btn kf-kern kf-keep" type="button" data-signin>Keep going</button>';
      segs[1].classList.toggle("on", n === 2);
    }
    function mark(t) {
      if (found[t]) return;
      found[t] = true;
      // The pop is a CSS transform, which would replace this group's own
      // translate, so the place and the pop are two groups.
      var c = document.createElementNS(NS, "g");
      c.setAttribute("transform", "translate(" + sx(t) + " " + sy(f(t)) + ")");
      c.innerHTML = '<g class="hit"><circle r="11"/><path d="m-4.6 .4 3.3 3.3 6-6.8"/></g>';
      $("#kfFound").appendChild(c);
      feedback(Object.keys(found).length);
    }
    function settle() {
      for (var i = 0; i < TARGETS.length; i++) {
        if (Math.abs(xNow - TARGETS[i]) < 0.16) { mark(TARGETS[i]); place(TARGETS[i]); return true; }
      }
      return false;
    }
    function reset() {
      found = {};
      $("#kfFound").innerHTML = "";
      feedback(0);
      place(2);
    }
    reset();

    // The pointer: anywhere on the plot moves the dot to that input.
    svg.addEventListener("pointerdown", function (e) {
      takeOver();
      dragging = true;
      try { svg.setPointerCapture(e.pointerId); } catch (x) { /* synthetic pointer */ }
      dot.classList.add("grab");
      place(svgX(e.clientX));
      e.preventDefault();
    });
    svg.addEventListener("pointermove", function (e) { if (dragging) place(svgX(e.clientX)); });
    function release() { if (!dragging) return; dragging = false; dot.classList.remove("grab"); settle(); }
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);
    dot.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 1 : 0.25, k = e.key;
      if (k !== "ArrowLeft" && k !== "ArrowRight" && k !== "ArrowUp" && k !== "ArrowDown") return;
      takeOver();
      place(xNow + (k === "ArrowLeft" || k === "ArrowDown" ? -step : step));
      settle();
      e.preventDefault();
    });

    /* The ghost: a cursor that does the step once, then again, until a real
       pointer or key arrives. */
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function tween(from, to, ms, fn, tk) {
      return new Promise(function (res, rej) {
        var t0 = null;
        function frame(ts) {
          if (tk !== token) { rej(); return; }
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / ms);
          fn(from + (to - from) * ease(p));
          if (p < 1) requestAnimationFrame(frame); else res();
        }
        requestAnimationFrame(frame);
      });
    }
    function wait(ms, tk) {
      return new Promise(function (res, rej) { setTimeout(function () { if (tk !== token) rej(); else res(); }, ms); });
    }
    function curTo(x, y) {   // cursor position in the stage's own pixels, from the plot's
      var r = svg.getBoundingClientRect(), k = r.width / W;
      cur.style.transform = "translate(" + (x * k + 3).toFixed(1) + "px," + (y * k + 4).toFixed(1) + "px)";
    }
    var inView = true, started = false;
    function takeOver() {
      if (user) return;
      user = true; token++;
      cur.classList.remove("on");
      dot.classList.remove("grab");
      reset();
    }
    function play() {
      if (reduced || user) return;
      var tk = ++token;
      (async function () {
        try {
          while (tk === token) {
            reset();
            cur.classList.remove("on");
            curTo(W - R - 20, H - B - 10);
            await wait(1100, tk);
            cur.classList.add("on");
            await wait(260, tk);
            var from = { x: sx(2) + 2, y: sy(f(2)) + 6 };
            await tween(0, 1, 800, function (p) { curTo(W - R - 20 + (from.x - (W - R - 20)) * p, H - B - 10 + (from.y - (H - B - 10)) * p); }, tk);
            dot.classList.add("grab");
            await wait(160, tk);
            await tween(2, 0, 1150, function (x) { place(x); curTo(sx(x) + 2, sy(f(x)) + 6); }, tk);
            settle(); dot.classList.remove("grab");
            await wait(650, tk);
            dot.classList.add("grab");
            await wait(120, tk);
            await tween(0, 4, 1500, function (x) { place(x); curTo(sx(x) + 2, sy(f(x)) + 6); }, tk);
            settle(); dot.classList.remove("grab");
            await wait(260, tk);
            cur.classList.remove("on");
            await wait(3400, tk);
          }
        } catch (e) { /* taken over or paused */ }
      })();
    }
    function pause() { token++; cur.classList.remove("on"); dot.classList.remove("grab"); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (user) return;
        if (inView) { if (!started || true) { started = true; setTimeout(function () { if (inView && !user) play(); }, 900); } }
        else { pause(); reset(); }
      }, { threshold: 0.4 }).observe($("#kfCard"));
    } else play();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (!user) { pause(); reset(); } } else if (!user && inView) play();
    });
  })();

  /* ----------------------------------------------------------------------
     The first row's picture: a triangle whose corner drifts while the three
     angles are read out. They always make 180.
     ---------------------------------------------------------------------- */
  (function triangle() {
    var shape = $("#kfTriShape"), c = $("#kfTriC"), ta = $("#kfTriA"), tb = $("#kfTriB"), tc = $("#kfTriCl");
    if (!shape) return;
    var A = [34, 142], Bp = [226, 142];
    function draw(t) {
      var C = [130 + 46 * Math.sin(t), 40 + 14 * Math.cos(t * 0.7 + 1)];
      shape.setAttribute("d", "M" + A + "L" + Bp + "L" + C.map(function (v) { return v.toFixed(1); }) + "Z");
      c.setAttribute("cx", C[0].toFixed(1)); c.setAttribute("cy", C[1].toFixed(1));
      function ang(P, Q, Rr) {   // the angle at P between Q and R, in degrees
        var a = Math.atan2(Q[1] - P[1], Q[0] - P[0]), b = Math.atan2(Rr[1] - P[1], Rr[0] - P[0]);
        var d = Math.abs(a - b); if (d > Math.PI) d = 2 * Math.PI - d;
        return d * 180 / Math.PI;
      }
      var a1 = Math.round(ang(A, Bp, C)), a2 = Math.round(ang(Bp, A, C)), a3 = 180 - a1 - a2;
      ta.textContent = a1 + "°"; ta.setAttribute("x", A[0] + 26); ta.setAttribute("y", A[1] - 8);
      tb.textContent = a2 + "°"; tb.setAttribute("x", Bp[0] - 26); tb.setAttribute("y", Bp[1] - 8);
      tc.textContent = a3 + "°"; tc.setAttribute("x", C[0] + 16); tc.setAttribute("y", C[1] + 5);
    }
    draw(0.6);
    if (reduced || !("IntersectionObserver" in window)) return;
    var on = false, t0 = null, raf = 0;
    function loop(ts) {
      if (!on) return;
      if (t0 === null) t0 = ts;
      draw(0.6 + (ts - t0) / 1900);
      raf = requestAnimationFrame(loop);
    }
    new IntersectionObserver(function (es) {
      on = es[0].isIntersecting;
      cancelAnimationFrame(raf);
      if (on) { t0 = null; raf = requestAnimationFrame(loop); }
    }, { threshold: 0.2 }).observe($("#kfTri"));
  })();
})();
