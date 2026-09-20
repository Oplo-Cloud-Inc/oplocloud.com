/* ==========================================================================
   Oplo Developer — dev.oplocloud.com.

   Everything the page does that markup cannot:

     media slots   draws the picture or film each slot names, or its label
                   when it names none yet — the same contract as OEdu's
                   welcome page (learn/landing.js)
     the hero      a rail of four that moves on its own until somebody stops
                   it, with dots that say how long each turn has left
     the rails     previous and next, and whether there is anywhere to go
     the site bar  the phone menu, as oplocloud.com's own bar does it
     the footer    link columns that fold into rows on a phone
     the film      plays in a lightbox, once a film has been given
     the reveal    sections rise as they arrive

   It talks to nothing. Every link off this page is an ordinary link.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("dev");
  if (!root) return;

  var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------------ Media slots
     A slot with no data-src draws its own name and the size it wants, so the
     page is legible — and reviewable — before a single picture exists. */
  var FILM = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
  var SLOT_ICON = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' " +
    "stroke-linejoin='round' aria-hidden='true'><rect x='3' y='5' width='18' height='14' rx='2.5'/>" +
    "<circle cx='9' cy='10' r='1.6'/><path d='m21 16-5-5-8 8'/></svg>";

  [].forEach.call(root.querySelectorAll(".dv-media"), function (slot) {
    var src = (slot.getAttribute("data-src") || "").trim();
    var alt = slot.getAttribute("data-alt") || "";
    if (!src) {
      slot.classList.add("is-empty");
      slot.innerHTML = "<span class='dv-slot'>" + SLOT_ICON + "<b>" + esc(slot.getAttribute("data-slot") || "Media") +
        "</b><small>" + esc(slot.getAttribute("data-size") || "") + "</small></span>";
      return;
    }
    var node;
    if (FILM.test(src)) {
      node = document.createElement("video");
      node.muted = true;
      node.loop = true;
      node.playsInline = true;
      node.setAttribute("playsinline", "");
      node.setAttribute("muted", "");
      node.preload = "metadata";
      if (!reduced) node.autoplay = true;
      if (alt) node.setAttribute("aria-label", alt); else node.setAttribute("aria-hidden", "true");
      node.src = src;
    } else {
      node = document.createElement("img");
      node.alt = alt;
      node.decoding = "async";
      node.loading = slot.hasAttribute("data-eager") ? "eager" : "lazy";
      node.src = src;
    }
    slot.appendChild(node);
  });

  /* ------------------------------------------------------------------- Hero
     The rail is the carousel: the slides are really there, side by side, and
     moving between them is a scroll. So a swipe, a trackpad, the dots and the
     clock all do the one thing, and nothing has to be kept in step with
     anything else — where the rail is scrolled to *is* which slide is on. */
  var TURN = 6000;
  var track = document.getElementById("dvHeroTrack");
  var dotsBox = document.getElementById("dvDots");
  var pauseBtn = document.getElementById("dvPause");

  if (track && dotsBox && pauseBtn) {
    var slides = [].slice.call(track.querySelectorAll(".dv-slide"));
    var dots = slides.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "dv-dot";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Slide " + (i + 1) + " of " + slides.length);
      b.innerHTML = "<span class='fill'></span>";
      b.addEventListener("click", function () { stop(); go(i); });
      dotsBox.appendChild(b);
      return b;
    });
    dotsBox.style.setProperty("--dv-turn", (TURN / 1000) + "s");

    var at = 0, timer = 0, settle = 0, paused = reduced, auto = false;

    /* A slide's centre, measured from the rail's own scroll origin. Not
       offsetLeft: that is measured from the nearest positioned ancestor,
       which is not this rail, while scrollLeft is the rail's — mixing the two
       puts every slide in the wrong place. */
    function centre(s) {
      return s.getBoundingClientRect().left - track.getBoundingClientRect().left +
             track.scrollLeft + s.offsetWidth / 2;
    }

    /* Which slide is on, asked of the rail rather than remembered, so a swipe
       and a press cannot disagree. */
    function nearest() {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, gap = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(centre(s) - mid);
        if (d < gap) { gap = d; best = i; }
      });
      return best;
    }

    function paint(i) {
      at = i;
      slides.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
      dots.forEach(function (d, n) {
        var fill = d.firstChild;
        if (n !== i) {
          d.classList.remove("is-on", "is-held");
          d.setAttribute("aria-selected", "false");
          fill.style.width = "";
          return;
        }
        d.setAttribute("aria-selected", "true");
        /* The clock is restarted by taking the transition off, putting the
           width back to nothing, and letting the browser see that width
           before the transition goes back on — otherwise it carries on from
           wherever the last turn left it. */
        d.classList.add("is-on", "is-held");
        fill.style.width = "0";
        void d.offsetWidth;
        if (paused) { fill.style.width = "100%"; return; }
        d.classList.remove("is-held");
        fill.style.width = "";
      });
    }

    function go(i) {
      i = (i + slides.length) % slides.length;
      auto = true;
      track.scrollTo({ left: centre(slides[i]) - track.clientWidth / 2,
                       behavior: reduced ? "auto" : "smooth" });
      paint(i);
      if (!paused) arm();
    }

    function arm() { clearTimeout(timer); timer = setTimeout(function () { go(at + 1); }, TURN); }

    function stop() {
      clearTimeout(timer);
      if (paused) return;
      paused = true;
      pauseBtn.setAttribute("aria-pressed", "true");
      pauseBtn.setAttribute("aria-label", "Play");
      /* Frozen where it had got to, not snapped back or forward. */
      var fill = dots[at].firstChild;
      fill.style.width = getComputedStyle(fill).width;
      dots[at].classList.add("is-held");
    }

    function start() {
      paused = false;
      pauseBtn.setAttribute("aria-pressed", "false");
      pauseBtn.setAttribute("aria-label", "Pause");
      paint(at);
      arm();
    }

    pauseBtn.addEventListener("click", function () { paused ? start() : stop(); });

    /* A scroll this script did not start is somebody moving the rail by hand,
       and somebody moving it by hand has taken it over: the turning stops and
       stays stopped until they press play. */
    track.addEventListener("scroll", function () {
      clearTimeout(settle);
      settle = setTimeout(function () {
        var byHand = !auto;
        auto = false;
        var i = nearest();
        if (byHand) {
          stop();
          if (i !== at) paint(i);
        }
      }, 140);
    }, { passive: true });

    track.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      stop();
      go(at + (e.key === "ArrowRight" ? 1 : -1));
    });

    /* Nothing turns over while the page is not being looked at — a tab left
       open for an hour should not come back on slide forty. */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearTimeout(timer);
      else if (!paused) { paint(at); arm(); }
    });

    /* A resize moves every slide, so the rail is put back on the one that was
       showing rather than left between two. */
    window.addEventListener("resize", function () {
      track.scrollTo({ left: centre(slides[at]) - track.clientWidth / 2, behavior: "auto" });
      auto = true;
    });

    if (paused) pauseBtn.setAttribute("aria-pressed", "true");
    paint(0);
    if (!paused) arm();
  }

  /* ------------------------------------------------------------------ Rails
     One page of cards per press, and the arrows go dim at the ends rather
     than sitting there doing nothing. */
  [].forEach.call(root.querySelectorAll(".dv-rail"), function (rail) {
    var name = rail.getAttribute("data-rail");
    var prev = root.querySelector('[data-rail-go="' + name + ':-1"]');
    var next = root.querySelector('[data-rail-go="' + name + ':1"]');
    if (!prev || !next) return;

    /* A press moves by the cards that are actually on screen — which is the
       rail less its leading inset, not its whole width: the rail runs the full
       window but starts where the heading does. Never less than one card. */
    function step() {
      var card = rail.firstElementChild;
      if (!card) return rail.clientWidth;
      var cs = getComputedStyle(rail);
      var gap = parseFloat(cs.columnGap) || 0;
      var one = card.getBoundingClientRect().width + gap;
      var seen = rail.clientWidth - (parseFloat(cs.paddingLeft) || 0);
      return Math.max(one, Math.floor(seen / one) * one);
    }
    function mark() {
      var end = rail.scrollWidth - rail.clientWidth;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= end - 2;
    }
    prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: reduced ? "auto" : "smooth" }); });
    next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: reduced ? "auto" : "smooth" }); });
    rail.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("resize", mark);
    mark();
  });

  /* ------------------------------------------------------------------ Film
     Any card with data-film opens the film named on the .dv-media beside it.
     Until one is named the box says where to put it, which is more use than
     a button that does nothing. */
  var box = document.getElementById("dvFilm");
  var video = document.getElementById("dvFilmVideo");
  var none = document.getElementById("dvFilmNone");

  function openFilm(src) {
    if (!box) return;
    if (src) {
      video.src = src;
      video.hidden = false;
      none.hidden = true;
    } else {
      video.removeAttribute("src");
      video.hidden = true;
      none.hidden = false;
    }
    box.hidden = false;
    hold();
    if (src) { try { video.play(); } catch (e) { /* the controls are there */ } }
  }
  function closeFilm() {
    if (!box || box.hidden) return;
    try { video.pause(); } catch (e) { /* already stopped */ }
    video.removeAttribute("src");
    box.hidden = true;
    hold();
  }
  root.addEventListener("click", function (e) {
    var close = e.target.closest("[data-film-close]");
    if (close) { closeFilm(); return; }
    var open = e.target.closest("[data-film]");
    if (!open) return;
    e.preventDefault();
    var card = open.closest(".dv-slide, .dv-film") || open;
    var slot = card.querySelector(".dv-media[data-film-src]");
    openFilm(slot && (slot.getAttribute("data-film-src") || "").trim());
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeFilm(); });

  /* The page is held still while anything sits on top of it: the film, the
     phone menu, or the site's search. */
  function hold() {
    var navLinks = document.getElementById("navLinks");
    var open = (box && !box.hidden) ||
               !!(navLinks && navLinks.classList.contains("open")) ||
               !!(window.OploSearch && window.OploSearch.isOpen());
    document.body.classList.toggle("dv-locked", open);
  }
  document.addEventListener("oplo:search", hold);

  /* --------------------------------------------------------------- Site bar
     The same behaviour as the inline script every oplocloud.com page carries,
     written here because this page is not built by tools/build.py. */
  var navEl = document.getElementById("nav");
  var navLinks = document.getElementById("navLinks");
  var navToggle = document.getElementById("navToggle");
  if (navEl && navLinks && navToggle) {
    var held = 0;
    var setNav = function (open) {
      if (open === navLinks.classList.contains("open")) return;
      if (open && window.OploSearch) window.OploSearch.close();
      if (open) {
        held = window.scrollY;
        document.body.style.top = (-held) + "px";
      } else {
        document.body.style.top = "";
      }
      navLinks.classList.toggle("open", open);
      navEl.classList.toggle("open", open);
      navToggle.classList.toggle("on", open);
      navToggle.setAttribute("aria-expanded", String(open));
      hold();
      if (!open) window.scrollTo(0, held);
    };
    navToggle.addEventListener("click", function () { setNav(!navLinks.classList.contains("open")); });
    navLinks.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    window.addEventListener("resize", function () { if (navLinks.classList.contains("open")) setNav(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });
  }

  /* ------------------------------------------------------------- The footer
     Below 734px the link columns collapse into tappable rows, and the notes —
     the smallest and longest thing on the page — fold shut. Both are what
     assets/js/oplo-motion.js does on the main site, and the markup has to
     match it exactly: the chevron and the desktop behaviour are the site's
     CSS reading `data-open` and a bare button, not anything drawn here. */
  [].forEach.call(root.querySelectorAll(".foot-col"), function (col) {
    var h = col.querySelector("h3");
    if (!h || h.querySelector("button")) return;
    var list = col.querySelector("ul");
    var label = h.textContent.trim();
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.setAttribute("aria-expanded", "false");
    if (list) {
      if (!list.id) list.id = "foot-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      btn.setAttribute("aria-controls", list.id);
    }
    h.textContent = "";
    h.appendChild(btn);
    btn.addEventListener("click", function () {
      var open = col.getAttribute("data-open") === "true";
      col.setAttribute("data-open", String(!open));
      btn.setAttribute("aria-expanded", String(!open));
    });
  });

  /* The notes ship with `open` set, so a reader without JavaScript gets them
     in full; on a phone they fold, and they open again if the window grows. */
  (function () {
    var d = root.querySelector(".notes-d");
    if (!d) return;
    var phone = window.matchMedia("(max-width: 734px)");
    var touched = false;
    d.addEventListener("toggle", function () { touched = true; });
    function sync() { if (!touched) d.open = !phone.matches; }
    sync();
    if (phone.addEventListener) phone.addEventListener("change", sync);
    else if (phone.addListener) phone.addListener(sync);
  })();

  /* ----------------------------------------------------------- The reveal
     Armed only once it can run, so a page without JavaScript — or one where
     this script fails — is a page with all its content, not a blank one. */
  if (!reduced && "IntersectionObserver" in window) {
    [].forEach.call(root.querySelectorAll(".dv-band > .dv-wrap, .dv-rail, .dv-hero-ctl"), function (n) {
      n.classList.add("dv-rise");
    });
    root.classList.add("dv-armed");
    var eye = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (!r.isIntersecting) return;
        r.target.classList.add("is-in");
        eye.unobserve(r.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .06 });
    [].forEach.call(root.querySelectorAll(".dv-rise"), function (n) { eye.observe(n); });
  }

  /* An in-page link goes to its section rather than jumping to it. */
  root.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || a.hasAttribute("data-film")) return;
    var id = a.getAttribute("href").slice(1);
    var t = id ? document.getElementById(id) : null;
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  });
})();
