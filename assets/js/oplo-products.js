/* ==========================================================================
   Products — the pause button on each shelf.
   The shelf drifts on its own (assets/css/oplo-products.css); this stops and
   starts it, and keeps the button's label true. With no script the shelf is
   a plain row that scrolls by hand and the button is never drawn.
   ========================================================================== */
(function () {
  "use strict";
  function start() {
    [].forEach.call(document.querySelectorAll(".svc-block"), function (block) {
      var btn = block.querySelector(".svc-pause");
      if (!btn) return;
      var name = block.getAttribute("data-name") || "";
      btn.addEventListener("click", function () {
        var paused = block.classList.toggle("is-paused");
        btn.setAttribute("aria-pressed", String(paused));
        btn.setAttribute("aria-label", (paused ? "Play" : "Pause") + " the " + name + " shelf");
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
