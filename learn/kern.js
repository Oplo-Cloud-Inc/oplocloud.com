/* ==========================================================================
   Kern — OEdu with the school taken out.

   kern.oplocloud.com is for learning on your own, by doing: courses you work
   through by solving. There is no classroom, nothing is set by anyone, and
   nothing is graded. app.js does the real work when window.OPLO_KERN is set
   (index.html); this file only gives the page its own name and its own front
   door, before sign-in. It never touches the network.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_KERN) return;

  document.title = "Kern — learn by doing";
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", "Kern — courses you work through by solving. No classroom, no grades.");
  var name = document.querySelector(".lx-name");
  if (name) name.textContent = "Kern";

  /* The welcome page: one sentence and one button. app.js still owns the
     sign-in (#gateGo, #gErr) and shows or hides the gate. */
  var gate = document.getElementById("gate");
  if (!gate) return;
  gate.className = "kern-gate ld-wait";
  gate.innerHTML =
    '<main class="kern-hero">' +
      '<svg class="kern-mark" viewBox="12 12 76 76" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" ' +
        'd="M12,40 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0 M32,60 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0"/></svg>' +
      '<p class="kern-k">Kern</p>' +
      '<h1>Learn by doing.</h1>' +
      '<p class="kern-sub">Courses you work through by solving, one step at a time. ' +
        'No classroom. No grades. Just you and the problem.</p>' +
      '<button class="lx-btn lg" type="button" id="gateGo">Continue with Oplo Account</button>' +
      '<p class="kern-err" id="gErr" role="alert"></p>' +
      '<p class="kern-fine">Your password is typed only at auth.oplocloud.com, in a tab of its own that closes when you are in. ' +
        'What you learn here is yours: no one sees it, and nothing is marked.</p>' +
    '</main>' +
    '<div id="ldSignin" hidden></div>';
})();
