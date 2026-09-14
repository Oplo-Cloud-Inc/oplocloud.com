/* ==========================================================================
   OEdu — the welcome page, before sign-in.

   Everything the page does that markup cannot:

     media slots   draws the picture or film each slot names, or its label
                   when it names none yet
     sign in       opens the panel from any "Sign in", and on arrival when
                   another page sent somebody here to sign in (?next=)
     the hero      draws in, rounded, as the window scrolls away from it
     the bars      the product bar's links fold behind a chevron on a phone
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

  /* ---------------------------------------------------------------- Sign in */
  var modal = document.getElementById("ldSignin");
  var returnTo = null;

  function openSignin(from) {
    if (!modal || !modal.hidden) return;
    returnTo = from || document.activeElement;
    modal.hidden = false;
    root.classList.add("ld-locked");
    closeMenu();
    setTimeout(function () {
      var email = document.getElementById("gEmail");
      if (email) email.focus();
    }, 60);
  }
  function closeSignin() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    root.classList.remove("ld-locked");
    if (returnTo && returnTo.focus) returnTo.focus();
  }

  /* ------------------------------------------------------------------ Film */
  var film = document.getElementById("ldFilm");
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
    root.classList.add("ld-locked");
    var go = player.play();
    if (go && go.catch) go.catch(function () { /* the controls are there */ });
  }
  function closeFilm() {
    if (!film || film.hidden) return;
    player.pause();
    player.removeAttribute("src");
    player.load();
    film.hidden = true;
    root.classList.remove("ld-locked");
  }

  /* ----------------------------------------------------------- Product bar */
  var sub = document.getElementById("ldSub");
  var menu = sub ? sub.querySelector(".ld-sub-menu") : null;
  function closeMenu() {
    if (!sub) return;
    sub.classList.remove("is-open");
    if (menu) menu.setAttribute("aria-expanded", "false");
  }
  if (menu) {
    menu.addEventListener("click", function () {
      var open = sub.classList.toggle("is-open");
      menu.setAttribute("aria-expanded", String(open));
    });
  }

  root.addEventListener("click", function (e) {
    var t = e.target;
    var signin = t.closest("[data-signin]");
    if (signin) { e.preventDefault(); openSignin(signin); return; }
    if (t.closest("[data-film]")) { e.preventDefault(); openFilm(); return; }
    if (t.closest("#ldSignin [data-close]")) { closeSignin(); return; }
    if (t.closest("#ldFilm [data-close]")) { closeFilm(); return; }
    if (t.closest(".ld-sub-links a")) closeMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || root.hidden) return;
    if (film && !film.hidden) closeFilm();
    else if (modal && !modal.hidden) closeSignin();
    else closeMenu();
  });

  // Sent here to sign in — from the family view, or a link that asked for it.
  if (/[?&]next=/.test(location.search) || location.hash === "#signin") openSignin();

  /* ------------------------------------------------------------------ Hero */
  var frame = root.querySelector(".ld-hero-frame");
  var queued = false;
  function paint() {
    queued = false;
    if (!frame || reduced) return;
    var r = frame.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, -r.top / (r.height * 0.55)));
    frame.style.setProperty("--p", p.toFixed(3));
  }
  root.addEventListener("scroll", function () {
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }, { passive: true });

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
