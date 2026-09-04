/* ==========================================================================
   Oplo — page motion
   Two behaviours, site-wide: the reveal-on-scroll used by every unit, and
   the footer's mobile disclosure rows. Dependency-free; safe to load twice.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__oploMotion) return;
  window.__oploMotion = true;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Arm the reveal styles. Until this runs the content is plainly visible, so
  // a page that never gets this far still reads correctly.
  var root = document.documentElement;
  if (!reduced) root.classList.add("oplo-motion");

  /* ------------------------------------------------ Reveal on scroll
     Elements rise into place once, as they cross into view. Anything already
     on screen at load resolves immediately so the first paint is never blank. */
  function reveals() {
    var nodes = [].slice.call(document.querySelectorAll(".reveal"));
    if (!nodes.length) return;

    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    nodes.forEach(function (n) {
      // Anything touching the first screen at load resolves immediately — on a
      // tall viewport the observer's bottom margin would otherwise leave
      // visible content hidden until a scroll that may never come.
      if (n.getBoundingClientRect().top < window.innerHeight) n.classList.add("in");
      else io.observe(n);
    });

    // Last resort: if the observer has not delivered by now — a background
    // tab that never rendered, a throttled engine — show everything anyway.
    setTimeout(function () {
      nodes.forEach(function (n) { n.classList.add("in"); });
      io.disconnect();
    }, 6000);
  }

  /* ------------------------------------------------ Footer disclosure
     Below 734px the five link columns collapse into tappable rows. Above it
     the CSS keeps them open and the buttons inert. */
  function footer() {
    var cols = [].slice.call(document.querySelectorAll(".foot-col"));
    cols.forEach(function (col) {
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
  }

  /* ------------------------------------------------ Pointer-tracked sheen
     Elements marked [data-tilt] get --mx/--my in the 0–1 range so their
     highlight can follow the cursor. Purely decorative. */
  function tilt() {
    if (reduced) return;
    var nodes = [].slice.call(document.querySelectorAll("[data-tilt]"));
    if (!nodes.length || !window.matchMedia("(hover: hover)").matches) return;
    nodes.forEach(function (n) {
      n.addEventListener("pointermove", function (e) {
        var r = n.getBoundingClientRect();
        n.style.setProperty("--mx", ((e.clientX - r.left) / r.width).toFixed(3));
        n.style.setProperty("--my", ((e.clientY - r.top) / r.height).toFixed(3));
      });
      n.addEventListener("pointerleave", function () {
        n.style.setProperty("--mx", ".5");
        n.style.setProperty("--my", ".5");
      });
    });
  }

  function start() { reveals(); footer(); tilt(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else { start(); }
})();
