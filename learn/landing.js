/* ==========================================================================
   OEdu — the welcome page, before sign-in.

   Everything the page does that markup cannot:

     media slots   draws the picture or film each slot names, or its label
                   when it names none yet
     sign in       opens the panel from any "Sign in", and on arrival when
                   another page sent somebody here to sign in (?next=)
     the site bar  the phone menu, as oplocloud.com's own bar does it — but
                   holding the page, which scrolls inside #gate, not the body
     the footer    link columns that fold into rows on a phone, as
                   assets/js/oplo-motion.js does it on the main site
     the hero      draws in, rounded, as the window scrolls away from it
     the rail      previous and next, and whether there is anywhere to go
     the film      plays in a lightbox, once a film has been given

   It never signs anybody in and never talks to the network: the form in the
   panel belongs to app.js, which submits it exactly as it always has.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("gate");
  if (!root || !root.classList.contains("ld")) return;

  var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* If the server takes a long time to say who this is, the page is shown
     anyway rather than left blank; app.js lifts the wait as soon as it knows. */
  setTimeout(function () { root.classList.remove("ld-wait"); }, 1800);

  /* ------------------------------------------------------------ Media slots */
  var FILM = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
  var SLOT_ICON = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' " +
    "stroke-linejoin='round' aria-hidden='true'><rect x='3' y='5' width='18' height='14' rx='2.5'/>" +
    "<circle cx='9' cy='10' r='1.6'/><path d='m21 16-5-5-8 8'/></svg>";

  [].forEach.call(root.querySelectorAll(".ld-media"), function (slot) {
    var src = (slot.getAttribute("data-src") || "").trim();
    var alt = slot.getAttribute("data-alt") || "";
    if (!src) {
      slot.classList.add("is-empty");
      slot.innerHTML = "<span class='ld-slot'>" + SLOT_ICON + "<b>" + esc(slot.getAttribute("data-slot") || "Media") +
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

  var modal = document.getElementById("ldSignin");
  var film = document.getElementById("ldFilm");

  /* The page is held still while anything sits on top of it: the phone menu,
     the sign-in panel or the film. */
  function hold() {
    var open = (modal && !modal.hidden) || (film && !film.hidden) ||
               !!(navLinks && navLinks.classList.contains("open")) ||
               !!(window.OploSearch && window.OploSearch.isOpen());
    root.classList.toggle("ld-locked", open);
  }
  // The site's search (oplo-search.js) holds and releases #gate itself; this
  // puts the hold back if something else is still open when search closes.
  document.addEventListener("oplo:search", hold);

  /* --------------------------------------------------------------- Site bar
     The same behaviour as the inline script every oplocloud.com page carries,
     except that it holds #gate rather than the body. */
  var navEl = document.getElementById("nav");
  var navLinks = document.getElementById("navLinks");
  var navToggle = document.getElementById("navToggle");
  function setNav(open) {
    if (!navEl || !navLinks || !navToggle) return;
    if (open === navLinks.classList.contains("open")) return;
    if (open && window.OploSearch) window.OploSearch.close();
    navLinks.classList.toggle("open", open);
    navEl.classList.toggle("open", open);
    navToggle.classList.toggle("on", open);
    navToggle.setAttribute("aria-expanded", String(open));
    hold();
  }
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () { setNav(!navLinks.classList.contains("open")); });
    navLinks.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    window.addEventListener("resize", function () { setNav(false); });
  }

  /* ----------------------------------------------------------------- Footer
     As assets/js/oplo-motion.js does it: below 734px each column's heading
     becomes a button that opens its list. Above it the CSS keeps them open
     and the buttons inert. */
  [].forEach.call(root.querySelectorAll(".foot-col"), function (col) {
    var h = col.querySelector("h3");
    if (!h || h.querySelector("button")) return;
    var list = col.querySelector("ul");
    var label = h.textContent.trim();
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.setAttribute("aria-expanded", "false");
    if (list) {
      if (!list.id) list.id = "foot-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      b.setAttribute("aria-controls", list.id);
    }
    h.textContent = "";
    h.appendChild(b);
    b.addEventListener("click", function () {
      var open = col.getAttribute("data-open") === "true";
      col.setAttribute("data-open", String(!open));
      b.setAttribute("aria-expanded", String(!open));
    });
  });

  /* ---------------------------------------------------------------- Sign in */
  var returnTo = null;
  function openSignin(from) {
    if (!modal || !modal.hidden) return;
    returnTo = from || document.activeElement;
    setNav(false);
    modal.hidden = false;
    hold();
    setTimeout(function () {
      var email = document.getElementById("gEmail");
      if (email) email.focus();
    }, 60);
  }
  function closeSignin() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    hold();
    if (returnTo && returnTo.focus) returnTo.focus();
  }

  /* ------------------------------------------------------------------ Film */
  var player = film ? film.querySelector("video") : null;
  var poster = root.querySelector("[data-film-src]");
  var filmSrc = poster ? (poster.getAttribute("data-film-src") || "").trim() : "";
  [].forEach.call(root.querySelectorAll("[data-film]"), function (b) {
    if (!filmSrc) {
      b.setAttribute("aria-disabled", "true");
      b.title = "The film has not been added yet";
    }
  });
  function openFilm() {
    if (!filmSrc || !film) return;
    player.src = filmSrc;
    film.hidden = false;
    hold();
    var go = player.play();
    if (go && go.catch) go.catch(function () { /* the controls are there */ });
  }
  function closeFilm() {
    if (!film || film.hidden) return;
    player.pause();
    player.removeAttribute("src");
    player.load();
    film.hidden = true;
    hold();
  }

  root.addEventListener("click", function (e) {
    var t = e.target;
    var signin = t.closest("[data-signin]");
    if (signin) { e.preventDefault(); openSignin(signin); return; }
    if (t.closest("[data-film]")) { e.preventDefault(); openFilm(); return; }
    if (t.closest("#ldSignin [data-close]")) { closeSignin(); return; }
    if (t.closest("#ldFilm [data-close]")) { closeFilm(); return; }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || root.hidden) return;
    if (film && !film.hidden) closeFilm();
    else if (modal && !modal.hidden) closeSignin();
    else setNav(false);
  });

  // Sent here to sign in — from the family view, or a link that asked for it.
  if (/[?&]next=/.test(location.search) || location.hash === "#signin") openSignin();

  /* ------------------------------------------------------------------ Hero */
  var frame = root.querySelector(".ld-hero-frame");
  var chapter = root.querySelector(".chapter");
  // Whether the page is dark just below y: the first painted background up
  // from whatever is there, in the middle of the window.
  function darkAt(y) {
    var at = document.elementFromPoint(window.innerWidth / 2, y);
    for (var n = at; n && n !== root.parentNode; n = n.parentElement) {
      if (n.classList && (n.classList.contains("chapter") || n.classList.contains("nav"))) continue;
      var m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(n).backgroundColor);
      if (!m) continue;
      var c = m[1].split(",").map(Number);
      if (c.length > 3 && c[3] < 0.5) continue;
      return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.4;
    }
    return false;
  }
  var queued = false;
  function paint() {
    queued = false;
    if (!frame) return;
    var r = frame.getBoundingClientRect();
    // The chapter bar takes the colour of what is under it: dark material
    // over the photograph and the black band, light over the rest.
    var edge = chapter ? chapter.getBoundingClientRect().bottom : 52;
    if (!root.classList.contains("ld-wait")) root.classList.toggle("ld-light", !darkAt(edge + 2));
    if (reduced) return;
    var p = Math.max(0, Math.min(1, -(r.top - 96) / (r.height * 0.55)));
    frame.style.setProperty("--p", p.toFixed(3));
  }
  root.addEventListener("scroll", function () {
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }, { passive: true });
  // The page is blank until the server has answered (.ld-wait), and nothing
  // can be measured under it until then: paint once it shows.
  paint();
  if (root.classList.contains("ld-wait") && typeof MutationObserver === "function") {
    var shown = new MutationObserver(function () {
      if (!root.classList.contains("ld-wait")) { shown.disconnect(); paint(); }
    });
    shown.observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  /* ------------------------------------------------------------------ Rail */
  var rail = document.getElementById("ldRail");
  var prev = root.querySelector("[data-rail='-1']");
  var next = root.querySelector("[data-rail='1']");
  function railState() {
    if (!rail || !prev || !next) return;
    prev.disabled = rail.scrollLeft <= 4;
    next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
  }
  if (rail) {
    [prev, next].forEach(function (b) {
      if (!b) return;
      b.addEventListener("click", function () {
        var card = rail.querySelector(".ld-wide");
        var w = card ? card.getBoundingClientRect().width + 16 : rail.clientWidth * 0.8;
        rail.scrollBy({ left: Number(b.getAttribute("data-rail")) * w, behavior: reduced ? "auto" : "smooth" });
      });
    });
    rail.addEventListener("scroll", railState, { passive: true });
    rail.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" && next) { e.preventDefault(); next.click(); }
      if (e.key === "ArrowLeft" && prev) { e.preventDefault(); prev.click(); }
    });
    window.addEventListener("resize", railState);
    railState();
  }

  /* ---------------------------------------------------------------- Reveal
     Only when somebody is watching: a page drawn in a background tab has its
     transitions frozen at their first frame, and would open blank. */
  if (!reduced && document.visibilityState === "visible" && typeof IntersectionObserver === "function") {
    root.classList.add("ld-anim");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { root: root, rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    [].forEach.call(root.querySelectorAll(".ld-reveal"), function (n) { io.observe(n); });
  }
})();
