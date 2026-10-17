/* ==========================================================================
   Products — the arrows on each shelf.
   A shelf is a row of cards that scrolls sideways by hand (assets/css/
   oplo-products.css). This arms its two arrows: each moves the row most of a
   window's width, and goes away at its own end. With no script the arrows are
   never drawn and the row still scrolls.
   ========================================================================== */
(function () {
  "use strict";
  function arm(shelf) {
    var track = shelf.querySelector(".st-track");
    var prev = shelf.querySelector(".st-arrow.prev");
    var next = shelf.querySelector(".st-arrow.next");
    if (!track || !prev || !next) return;
    var calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    function update() {
      var room = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft < 2;
      // A row that is only a hair too wide (a card edging into the margin)
      // does not need an arrow.
      next.disabled = room < 48 || track.scrollLeft > room - 2;
    }
    function go(dir) {
      track.scrollBy({ left: dir * Math.max(320, track.clientWidth * 0.8), behavior: calm.matches ? "auto" : "smooth" });
    }
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // The row's size or any card's (cards in a row of four resize with the window).
    if (window.ResizeObserver) {
      var watch = new ResizeObserver(update);
      watch.observe(track);
      [].forEach.call(track.children, function (item) { watch.observe(item); });
    }
    shelf.classList.add("st-ready");
    update();
  }
  function start() { [].forEach.call(document.querySelectorAll(".st-shelf"), arm); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
