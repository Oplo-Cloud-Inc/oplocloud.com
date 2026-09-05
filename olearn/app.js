/* ==========================================================================
   OLearn — demo behaviour.
   No backend, no storage, no network. Every name and number below is invented
   sample data so the console can be operated rather than looked at.
   ========================================================================== */
(function () {
  "use strict";

  var STUDENTS = [
    { id: "ao", name: "Amara Osei",     state: "following", hue: "#4a7dff", pct: 88, note: "Two steps ahead", last: "Answered step 3" },
    { id: "bw", name: "Ben Whitlock",   state: "stuck",     hue: "#ff8a5c", pct: 41, note: "11 minutes on step 4", last: "No input since 10:12" },
    { id: "ck", name: "Chidi Nwosu",    state: "hand",      hue: "#35d07f", pct: 72, note: "Hand raised", last: "Asked about factoring" },
    { id: "dl", name: "Dara Lindqvist", state: "following", hue: "#8f5cff", pct: 79, note: "Working", last: "Answered step 3" },
    { id: "em", name: "Elif Mardin",    state: "following", hue: "#00b8c4", pct: 94, note: "Working", last: "Answered step 3" },
    { id: "fg", name: "Femi Gbadamosi", state: "stuck",     hue: "#ffb84d", pct: 55, note: "Guessing — three wrong in a row", last: "Retried step 2" },
    { id: "hn", name: "Hana Ito",       state: "away",      hue: "#6c6d74", pct: 63, note: "Tab not focused for 4 min", last: "Left at 10:09" },
    { id: "jr", name: "Jonas Reyes",    state: "following", hue: "#ff6b9d", pct: 81, note: "Working", last: "Answered step 3" }
  ];

  var WORK = [
    { t: "Factoring quadratics",     s: "Due Thursday", done: 22, of: 28 },
    { t: "Completing the square",    s: "Due Monday",   done: 9,  of: 28 },
    { t: "The discriminant",         s: "Draft",        done: 0,  of: 28 },
    { t: "Graphing parabolas",       s: "Returned",     done: 28, of: 28 }
  ];

  var TREE = [
    { t: "Expanding brackets",        s: "Mastered",              k: "done" },
    { t: "Factoring simple trinomials", s: "Mastered",            k: "done" },
    { t: "Factoring with a leading coefficient", s: "In progress — 6 of 10 correct", k: "now" },
    { t: "Completing the square",     s: "Opens after the step above", k: "locked" },
    { t: "The quadratic formula",     s: "Locked",                k: "locked" },
    { t: "Discriminant and roots",    s: "Locked",                k: "locked" }
  ];

  var TUTORS = [
    { n: "Priya Raman",   s: "Algebra &middot; 9 years teaching", pct: 98, hue: "#4a7dff" },
    { n: "Marcus Feld",   s: "Maths &middot; free for 40 minutes", pct: 95, hue: "#35d07f" },
    { n: "Ana Sousa",     s: "Algebra and calculus",              pct: 97, hue: "#8f5cff" }
  ];

  var STEPS = [
    ["x&sup2; &minus; 5x + 6 = 0", "Step 1 &middot; read off a, b and c"],
    ["x&sup2; &minus; 5x + 6 = 0", "Step 2 &middot; find two numbers multiplying to 6"],
    ["x&sup2; &minus; 5x + 6 = 0", "Step 3 &middot; factor the left side"],
    ["(x &minus; 2)(x &minus; 3) = 0", "Step 4 &middot; set each bracket to zero"],
    ["x = 2 &nbsp; or &nbsp; x = 3", "Solved &middot; two real roots"]
  ];

  var $  = function (s) { return document.querySelector(s); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var initials = function (name) {
    return name.split(" ").map(function (w) { return w[0]; }).slice(0, 2).join("");
  };

  /* -------------------------------------------------- Toast */
  var toastEl = $("#toast"), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, 2400);
  }

  /* -------------------------------------------------- Views */
  function go(view) {
    [].forEach.call(document.querySelectorAll(".ol-view"), function (v) {
      v.classList.toggle("on", v.id === "v-" + view);
    });
    [].forEach.call(document.querySelectorAll(".ol-rail button"), function (b) {
      b.setAttribute("aria-current", String(b.dataset.go === view));
    });
  }
  document.addEventListener("click", function (e) {
    var g = e.target.closest("[data-go]");
    if (g) { go(g.dataset.go); return; }
    var a = e.target.closest("[data-act]");
    if (a) act(a.dataset.act);
  });

  /* -------------------------------------------------- Roster */
  var selected = null;
  function drawPeople() {
    var box = $("#people");
    box.innerHTML = "";
    STUDENTS.forEach(function (s) {
      var b = el("button", "person");
      b.type = "button";
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", String(selected === s.id));
      b.innerHTML =
        '<span class="face" style="background:' + s.hue + '">' + initials(s.name) + '</span>' +
        '<span class="who"><span class="nm">' + s.name + '</span>' +
        '<span class="st">' + s.note + '</span></span>' +
        '<span class="dotstate ' + s.state + '" title="' + s.state + '"></span>';
      b.addEventListener("click", function () { selected = s.id; drawPeople(); drawDetail(s); });
      box.appendChild(b);
    });
    var here = STUDENTS.filter(function (s) { return s.state !== "away"; }).length;
    $("#hereCount").textContent = here + " of " + STUDENTS.length + " here";
  }

  function drawDetail(s) {
    var d = $("#detail");
    d.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
        '<span class="face" style="background:' + s.hue + '">' + initials(s.name) + '</span>' +
        '<span><b style="color:var(--ink);font-size:14px">' + s.name + '</b>' +
        '<span style="display:block;font-size:11.5px;color:var(--ink-3)">' + s.note + '</span></span>' +
      '</div>' +
      '<div class="kv"><span>Mastery</span><b>' + s.pct + '%</b></div>' +
      '<div class="kv"><span>State</span><b>' + s.state + '</b></div>' +
      '<div class="kv"><span>Last seen</span><b>' + s.last + '</b></div>' +
      '<div style="margin-top:auto;display:flex;gap:8px;padding-top:12px">' +
        '<button class="pill sm" data-act="nudge">Check in</button>' +
        '<button class="pill sm go" data-act="tutor">Offer a tutor</button>' +
      '</div>';
  }

  /* -------------------------------------------------- Lists */
  function meter(pct, done) {
    return '<span class="meter' + (done ? " done" : "") + '"><i style="width:' + pct + '%"></i></span>';
  }
  function drawWork() {
    ["#workList", "#workMini"].forEach(function (sel, i) {
      var box = $(sel); box.innerHTML = "";
      WORK.slice(0, i ? 3 : WORK.length).forEach(function (w) {
        var pct = Math.round(w.done / w.of * 100);
        var b = el("button", "rowitem");
        b.type = "button";
        b.innerHTML = '<span class="t"><b>' + w.t + '</b><span>' + w.s + '</span></span>' +
                      meter(pct, pct === 100) + '<span class="num">' + w.done + "/" + w.of + '</span>';
        b.addEventListener("click", function () { toast(w.t + " — " + w.done + " of " + w.of + " handed in"); });
        box.appendChild(b);
      });
    });
  }
  function drawTree() {
    var box = $("#tree"); box.innerHTML = "";
    TREE.forEach(function (n, i) {
      var b = el("button", "node " + n.k);
      b.type = "button";
      b.innerHTML = '<span class="mark">' + (n.k === "done" ? "&#10003;" : (i + 1)) + '</span>' +
                    '<span class="t"><b>' + n.t + '</b><span>' + n.s + '</span></span>';
      b.addEventListener("click", function () {
        toast(n.k === "locked" ? "Locked until the step before it is mastered" : n.t + " — " + n.s);
      });
      box.appendChild(b);
    });
    var done = TREE.filter(function (n) { return n.k === "done"; }).length;
    $("#masteryPct").textContent = Math.round(done / TREE.length * 100) + "% mastered";

    var mini = $("#masteryMini"); mini.innerHTML = "";
    TREE.slice(0, 3).forEach(function (n) {
      var pct = n.k === "done" ? 100 : n.k === "now" ? 60 : 0;
      var b = el("button", "rowitem");
      b.type = "button";
      b.innerHTML = '<span class="t"><b>' + n.t + '</b><span>' + n.s + '</span></span>' + meter(pct, pct === 100);
      b.addEventListener("click", function () { go("mastery"); });
      mini.appendChild(b);
    });
  }
  function drawTutors() {
    var box = $("#tutorList"); box.innerHTML = "";
    TUTORS.forEach(function (t) {
      var b = el("button", "rowitem");
      b.type = "button";
      b.innerHTML = '<span class="face" style="background:' + t.hue + '">' + initials(t.n) + '</span>' +
                    '<span class="t"><b>' + t.n + '</b><span>' + t.s + '</span></span>' +
                    '<span class="num">' + t.pct + '%</span>' +
                    '<span class="pill sm go">Request</span>';
      b.addEventListener("click", function () { toast("Request sent to " + t.n + " (demo — nothing was sent)"); });
      box.appendChild(b);
    });
  }

  /* -------------------------------------------------- Board + actions */
  var step = 2;
  function drawBoard() {
    $("#boardQ").innerHTML = STEPS[step][0];
    var s = $("#boardStep");
    s.innerHTML = STEPS[step][1];
    s.classList.toggle("hot", step === STEPS.length - 1);
  }
  function act(what) {
    if (what === "next")    { step = Math.min(step + 1, STEPS.length - 1); drawBoard(); }
    else if (what === "reset") { step = 0; drawBoard(); }
    else if (what === "share") toast("Board shared with the class");
    else if (what === "ask-all") toast("Asked the class to try step " + (step + 1));
    else if (what === "assign")  toast("New coursework — the editor would open here");
    else if (what === "nudge")   toast("Checked in privately");
    else if (what === "tutor")   { go("tutors"); toast("Pick a tutor to offer"); }
    else if (what === "send") {
      var i = $("#msg");
      if (i.value.trim()) { toast("Sent to the class (demo — nothing left this page)"); i.value = ""; }
      else i.focus();
    }
  }
  $("#msg").addEventListener("keydown", function (e) { if (e.key === "Enter") act("send"); });

  /* -------------------------------------------------- Clock */
  var t0 = Date.now();
  setInterval(function () {
    var s = Math.floor((Date.now() - t0) / 1000);
    $("#clock").textContent =
      String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }, 1000);

  drawPeople(); drawWork(); drawTree(); drawTutors(); drawBoard();
})();
