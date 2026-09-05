/* ==========================================================================
   OLearn — demo behaviour.
   No backend, no storage, no network. Every name, course and date below is
   invented sample data so the console can be operated rather than looked at.
   The dashboard is a student's view: their courses, what has been announced,
   what is due, and who is tutoring them.
   ========================================================================== */
(function () {
  "use strict";

  var COURSES = [
    { t: "Algebra II",    s: "Ms. Reyes &middot; Period 3", pct: 68, hue: "#4a7dff", live: true },
    { t: "Chemistry",     s: "Dr. Okonkwo &middot; Period 1", pct: 41, hue: "#35d07f" },
    { t: "World History", s: "Mr. Halvorsen &middot; Period 5", pct: 84, hue: "#ffb84d" },
    { t: "Spanish III",   s: "Sra. Delgado &middot; Period 2", pct: 55, hue: "#8f5cff" },
    { t: "Studio Art",    s: "Ms. Bianchi &middot; Period 7", pct: 92, hue: "#ff6b9d" }
  ];

  var NOTES = [
    { t: "Friday quiz moved to Monday", s: "Algebra II &middot; Ms. Reyes", w: "2h", unread: true },
    { t: "Lab safety form still outstanding", s: "Chemistry &middot; Dr. Okonkwo", w: "5h", unread: true },
    { t: "Essay feedback is posted", s: "World History &middot; Mr. Halvorsen", w: "Yesterday", unread: true },
    { t: "Oral practice groups posted", s: "Spanish III &middot; Sra. Delgado", w: "Tue", unread: false },
    { t: "Gallery walk is next Thursday", s: "Studio Art &middot; Ms. Bianchi", w: "Mon", unread: false }
  ];

  var WORK = [
    { t: "Factoring quadratics", s: "Algebra II", due: "Today",     k: "late"  },
    { t: "Lab report 3",         s: "Chemistry",  due: "Tomorrow",  k: "open"  },
    { t: "Completing the square",s: "Algebra II", due: "Thursday",  k: "open"  },
    { t: "Reformation essay",    s: "World History", due: "Monday", k: "draft" },
    { t: "Verb tense set 4",     s: "Spanish III", due: "Handed in", k: "done" }
  ];

  var MY_TUTOR = {
    n: "Priya Raman", s: "Algebra &middot; 9 years teaching", hue: "#4a7dff",
    when: "Thursday, 4:30pm", topic: "Factoring with a leading coefficient"
  };

  var STUDENTS = [
    { id: "bw", name: "Ben Whitlock",   state: "stuck",     hue: "#ff8a5c", note: "On step 4" },
    { id: "ck", name: "Chidi Nwosu",    state: "hand",      hue: "#35d07f", note: "Hand raised" },
    { id: "dl", name: "Dara Lindqvist", state: "following", hue: "#8f5cff", note: "Working" },
    { id: "em", name: "Elif Mardin",    state: "following", hue: "#00b8c4", note: "Working" },
    { id: "fg", name: "Femi Gbadamosi", state: "stuck",     hue: "#ffb84d", note: "Three wrong in a row" },
    { id: "hn", name: "Hana Ito",       state: "away",      hue: "#6c6d74", note: "Away" },
    { id: "jr", name: "Jonas Reyes",    state: "following", hue: "#ff6b9d", note: "Working" }
  ];

  var TREE = [
    { t: "Expanding brackets", s: "Mastered", k: "done" },
    { t: "Factoring simple trinomials", s: "Mastered", k: "done" },
    { t: "Factoring with a leading coefficient", s: "In progress — 6 of 10 correct", k: "now" },
    { t: "Completing the square", s: "Opens after the step above", k: "locked" },
    { t: "The quadratic formula", s: "Locked", k: "locked" },
    { t: "Discriminant and roots", s: "Locked", k: "locked" }
  ];

  var TUTORS = [
    { n: "Priya Raman", s: "Algebra &middot; your tutor", pct: 98, hue: "#4a7dff" },
    { n: "Marcus Feld", s: "Maths &middot; free for 40 minutes", pct: 95, hue: "#35d07f" },
    { n: "Ana Sousa",   s: "Algebra and calculus", pct: 97, hue: "#8f5cff" }
  ];

  var STEPS = [
    ["x&sup2; &minus; 5x + 6 = 0", "Step 1 &middot; read off a, b and c"],
    ["x&sup2; &minus; 5x + 6 = 0", "Step 2 &middot; find two numbers multiplying to 6"],
    ["x&sup2; &minus; 5x + 6 = 0", "Step 3 &middot; factor the left side"],
    ["(x &minus; 2)(x &minus; 3) = 0", "Step 4 &middot; set each bracket to zero"],
    ["x = 2 &nbsp; or &nbsp; x = 3", "Solved &middot; two real roots"]
  ];

  var $ = function (s) { return document.querySelector(s); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var initials = function (n) {
    return n.split(" ").map(function (w) { return w[0]; }).slice(0, 2).join("");
  };

  var toastEl = $("#toast"), tTimer;
  function toast(m) {
    toastEl.textContent = m;
    toastEl.classList.add("on");
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { toastEl.classList.remove("on"); }, 2400);
  }

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

  /* ------------------------------------------------ Box 1: courses */
  function meter(pct, done) {
    return '<span class="meter' + (done ? " done" : "") + '"><i style="width:' + pct + '%"></i></span>';
  }
  function drawCourses() {
    var box = $("#courses"); box.innerHTML = "";
    COURSES.forEach(function (c) {
      var b = el("button", "rowitem");
      b.type = "button";
      b.innerHTML =
        '<span class="face" style="background:' + c.hue + '">' + initials(c.t) + '</span>' +
        '<span class="t"><b>' + c.t + (c.live ? ' <span class="chip live" style="margin-left:6px">Live</span>' : "") +
        '</b><span>' + c.s + '</span></span>' +
        meter(c.pct) + '<span class="num">' + c.pct + '%</span>';
      b.addEventListener("click", function () {
        if (c.live) { go("class"); toast("Joining " + c.t); }
        else toast(c.t + " — " + c.pct + "% complete");
      });
      box.appendChild(b);
    });
    $("#courseCount").textContent = COURSES.length + " enrolled";
  }

  /* ------------------------------------------ Box 2: announcements */
  function drawNotes() {
    var box = $("#notes"); box.innerHTML = "";
    NOTES.forEach(function (n) {
      var b = el("button", "note");
      b.type = "button";
      b.innerHTML =
        '<span class="unread' + (n.unread ? "" : " read") + '"></span>' +
        '<span class="t"><b>' + n.t + '</b><span>' + n.s + '</span></span>' +
        '<span class="when">' + n.w + '</span>';
      b.addEventListener("click", function () {
        n.unread = false; drawNotes(); toast(n.t);
      });
      box.appendChild(b);
    });
    var u = NOTES.filter(function (n) { return n.unread; }).length;
    $("#unreadCount").textContent = u ? u + " unread" : "All read";
  }

  /* -------------------------------------------- Box 3: assignments */
  var STATUS = {
    late:  ["Due today", "#ff6b6b"],
    open:  ["Not started", "#9a9ba1"],
    draft: ["Draft saved", "#ffb84d"],
    done:  ["Handed in", "#35d07f"]
  };
  function drawWork() {
    var box = $("#assignments"); box.innerHTML = "";
    WORK.forEach(function (w) {
      var st = STATUS[w.k];
      var b = el("button", "rowitem");
      b.type = "button";
      b.innerHTML =
        '<span class="t"><b>' + w.t + '</b><span>' + w.s + ' &middot; ' + w.due + '</span></span>' +
        '<span class="num" style="color:' + st[1] + ';min-width:72px">' + st[0] + '</span>';
      b.addEventListener("click", function () { toast(w.t + " — " + st[0]); });
      box.appendChild(b);
    });
    var open = WORK.filter(function (w) { return w.k !== "done"; }).length;
    $("#dueCount").textContent = open + " outstanding";
  }

  /* --------------------------------------------------- Box 4: tutor */
  function drawTutor() {
    var t = MY_TUTOR;
    $("#tutorCard").innerHTML =
      '<div class="top">' +
        '<span class="face" style="background:' + t.hue + '">' + initials(t.n) + '</span>' +
        '<span><b>' + t.n + '</b><span>' + t.s + '</span></span>' +
      '</div>' +
      '<div class="next">' +
        '<span style="flex:1"><span class="lbl">Next session</span><b>' + t.when + '</b></span>' +
      '</div>' +
      '<div class="next">' +
        '<span style="flex:1"><span class="lbl">Working on</span><b>' + t.topic + '</b></span>' +
      '</div>' +
      '<div class="acts">' +
        '<button class="pill" data-act="msg-tutor">Message</button>' +
        '<button class="pill" data-act="resched">Reschedule</button>' +
        '<button class="pill go" data-act="join-tutor">Join early</button>' +
      '</div>';
  }

  /* ------------------------------------------------ Class + mastery */
  function drawPeople() {
    var box = $("#people"); box.innerHTML = "";
    STUDENTS.forEach(function (s) {
      var b = el("button", "person");
      b.type = "button";
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", "false");
      b.innerHTML =
        '<span class="face" style="background:' + s.hue + '">' + initials(s.name) + '</span>' +
        '<span class="who"><span class="nm">' + s.name + '</span><span class="st">' + s.note + '</span></span>' +
        '<span class="dotstate ' + s.state + '" title="' + s.state + '"></span>';
      b.addEventListener("click", function () {
        [].forEach.call(box.children, function (c) { c.setAttribute("aria-selected", "false"); });
        b.setAttribute("aria-selected", "true");
        toast(s.name + " — " + s.note);
      });
      box.appendChild(b);
    });
    var here = STUDENTS.filter(function (s) { return s.state !== "away"; }).length;
    $("#hereCount").textContent = (here + 1) + " of " + (STUDENTS.length + 1) + " here";
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
    if (what === "next") { step = Math.min(step + 1, STEPS.length - 1); drawBoard(); }
    else if (what === "reset") { step = 0; drawBoard(); }
    else if (what === "hand") toast("Hand raised");
    else if (what === "msg-tutor") toast("Message sent to " + MY_TUTOR.n + " (demo — nothing was sent)");
    else if (what === "resched") toast("Reschedule — the picker would open here");
    else if (what === "join-tutor") toast("Nothing to join until " + MY_TUTOR.when);
    else if (what === "send") {
      var i = $("#msg");
      if (i.value.trim()) { toast("Sent to the class (demo — nothing left this page)"); i.value = ""; }
      else i.focus();
    }
  }
  $("#msg").addEventListener("keydown", function (e) { if (e.key === "Enter") act("send"); });

  var t0 = Date.now();
  setInterval(function () {
    var s = Math.floor((Date.now() - t0) / 1000);
    $("#clock").textContent =
      String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }, 1000);

  drawCourses(); drawNotes(); drawWork(); drawTutor();
  drawPeople(); drawTree(); drawTutors(); drawBoard();
})();
