/* ==========================================================================
   Oplo Learn — demo.
   One course is playable end to end. No backend, no storage, no network:
   progress lives in memory for the length of the visit and then is gone.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var el = function (t, c, h) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (h != null) n.innerHTML = h;
    return n;
  };

  /* ------------------------------------------------------------ Figures */
  function grid(cols, rows) {
    var s = '<svg viewBox="0 0 ' + (cols * 40) + ' ' + (rows * 40) + '">';
    for (var y = 0; y < rows; y++)
      for (var x = 0; x < cols; x++)
        s += '<circle cx="' + (x * 40 + 20) + '" cy="' + (y * 40 + 20) + '" r="11" fill="#0071e3"/>';
    return s + "</svg>";
  }
  function rects() {
    return '<svg viewBox="0 0 360 150">' +
      '<rect x="8" y="20" width="120" height="110" rx="5" fill="#0071e3" opacity=".9"/>' +
      '<text x="68" y="145" text-anchor="middle" font-size="15" fill="#6e6e73" font-family="Inter,sans-serif">A</text>' +
      '<rect x="196" y="45" width="156" height="85" rx="5" fill="#12915a" opacity=".9"/>' +
      '<text x="274" y="145" text-anchor="middle" font-size="15" fill="#6e6e73" font-family="Inter,sans-serif">B</text>' +
      '</svg>';
  }
  function ell() {
    var s = '<svg viewBox="0 0 260 220">', cells = [];
    for (var y = 0; y < 5; y++) for (var x = 0; x < 5; x++) if (x < 2 || y > 2) cells.push([x, y]);
    cells.forEach(function (c) {
      s += '<rect x="' + (10 + c[0] * 40) + '" y="' + (10 + c[1] * 40) + '" width="40" height="40" ' +
           'fill="#e7f1fd" stroke="#0071e3" stroke-width="1.6"/>';
    });
    return s + "</svg>";
  }
  function tri() {
    var s = '<svg viewBox="0 0 380 120">', xs = [0, 74, 172, 296], counts = [1, 3, 6, 10];
    counts.forEach(function (n, i) {
      var r = 0, placed = 0, row = 0;
      for (r = 1; placed < n; r++) {
        for (var k = 0; k < r && placed < n; k++, placed++)
          s += '<circle cx="' + (xs[i] + 20 + k * 17 - (r - 1) * 8.5 + 24) + '" cy="' + (16 + row * 18) + '" r="6.5" fill="#0071e3"/>';
        row++;
      }
      s += '<text x="' + (xs[i] + 44) + '" y="110" text-anchor="middle" font-size="14" fill="#6e6e73" font-family="Inter,sans-serif">' + n + '</text>';
    });
    return s + "</svg>";
  }

  /* ------------------------------------------------------------ Content */
  var PROBLEMS = [
    {
      ask: "How many dots are here?",
      hint: "Try not to count them one at a time.",
      fig: grid(6, 4),
      type: "choice",
      opts: ["20", "22", "24", "26"],
      right: 2,
      why: "Six across and four down. Rather than counting 24 things, you count 6 and 4 and multiply — " +
           "which is what multiplication is for. An array turns counting into two much smaller counts."
    },
    {
      ask: "Which rectangle covers more?",
      hint: "A is 3 wide and 11 tall. B is 6 wide and 5 tall. Same unit either way.",
      fig: rects(),
      type: "choice",
      opts: ["A", "B", "They are equal"],
      right: 0,
      why: "A is 3 &times; 11 = 33 units. B is 6 &times; 5 = 30. B looks wider and squatter, which reads as " +
           "bigger — but width is only half the story. The taller sliver wins by three."
    },
    {
      ask: "How many unit squares make this shape?",
      hint: "There is a faster way than counting each square.",
      fig: ell(),
      type: "number",
      right: 16,
      why: "The full 5 &times; 5 square is 25. The missing corner is 3 &times; 3 = 9. So 25 &minus; 9 = 16. " +
           "Subtracting what is absent is often quicker than adding what is present."
    },
    {
      ask: "The pattern grows 1, 3, 6, 10. What comes next?",
      hint: "Look at what gets added each time, not the totals.",
      fig: tri(),
      type: "choice",
      opts: ["13", "14", "15", "16"],
      right: 2,
      why: "The gaps are 2, then 3, then 4 — so the next gap is 5, giving 15. Each step adds one more " +
           "row than the last. These are the triangular numbers, and they turn up everywhere once you " +
           "know the shape."
    },
    {
      ask: "A 6 &times; 4 rectangle is cut once, straight through the middle. What is true of the two pieces?",
      hint: "Think about it before picturing a particular cut.",
      type: "choice",
      opts: [
        "They have equal area only if the cut is horizontal",
        "They have equal area only if the cut is vertical",
        "They have equal area for any straight cut through the centre",
        "It depends where the centre is"
      ],
      right: 2,
      why: "Any straight line through the centre of a rectangle splits it into two equal halves. The " +
           "rectangle has rotational symmetry about that point, so each piece maps exactly onto the " +
           "other — the angle of the cut never matters."
    }
  ];


  var MEDIA_UNITS = [
    "What are Media Arts?", "The Basics of Design", "Digital Media and Web Design",
    "The \u201CWeb 2.0\u201D", "Waves and Sound", "Intro to Photography",
    "Video Basics", "Intro to Animation", "Audio/Video Production"
  ];

  var BIZ_A = [
    "Introduction to Business", "Economics and Business",
    "Business Ethics and Social Responsibility", "International Business",
    "Business Writing", "Types of Business Ownership",
    "Small Business and Entrepreneurship", "Management",
    "Organizational Structure", "Operations Management",
    "Motivation Theories and Applications"
  ];
  var BIZ_B = [
    "Human Resource Management", "Organized Labor Relations",
    "Marketing and the Customer", "Product and Pricing Strategies",
    "Product Distribution", "Marketing Communications",
    "Financial Statements", "Financial Management",
    "Managing Information Technology", "Functions of Money and Banking"
  ];

  var SCALE = [["A", "90\u2013100"], ["B", "80\u201389"], ["C", "70\u201379"],
               ["D", "60\u201369"], ["F", "under 59"]];

  var COURSES = [
    {
      id: "seeing", t: "Seeing numbers", hue: "#0071e3", subject: "Mathematics",
      d: "Arithmetic you can look at. Arrays, areas and patterns, done by noticing rather than calculating.",
      lede: "Most arithmetic is taught as a procedure. This course does it as a picture — once you can see why a rule works, you stop needing to remember it.",
      units: [
        { t: "Counting in shapes", s: "5 problems &middot; about 5 minutes", play: true },
        { t: "Areas without formulas", s: "Opens after the unit above", play: false },
        { t: "Patterns that grow", s: "Opens after the unit above", play: false }
      ],
      glyph: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>'
    },
    {
      id: "media", t: "Media Arts", hue: "#8f5cff", subject: "Arts and Design",
      d: "Design, photography, video, animation and sound \u2014 the media you use every day, taken apart.",
      lede: "Media arts are everywhere, which is exactly why they go unnoticed. This course covers the history and the practice: design principles, digital media and the web, photography, video, animation and audio production.",
      tag: "Arts and Design",
      objectives: [
        "Briefly describe the history of print, design and media.",
        "Explain the five key principles of design and how they are used.",
        "Describe the fundamentals and applications of digital media and web design.",
        "List and describe the applications of various web-based tools used in blogs and wikis.",
        "Describe the history and application of photography, video, animation and audio/video production."
      ],
      parts: [{ name: null, units: MEDIA_UNITS }],
      grading: [["Quizzes", 35], ["Assignments", 35], ["Mid-term and final exams", 30]],
      textbook: "EHS Media Arts \u2014 \u00A9 Excel Education Systems, Inc., 2021.",
      glyph: '<circle cx="12" cy="12" r="3.4"/><path d="M3 8.5h3.5L8.5 6h7l2 2.5H21v10H3z"/>'
    },
    {
      id: "biz", t: "Introduction to Business", hue: "#12915a", subject: "Business",
      d: "Planning and launching something real \u2014 economics, structure, money and the plan that holds it together.",
      lede: "What it actually takes to plan and launch a product or service. Economics, costs and profit, business types, money and taxes, financing, and how a business sits inside the society around it \u2014 built toward writing a plan you could hand to somebody.",
      tag: "Two semesters",
      objectives: [
        "Understand basic economic principles.",
        "Develop workplace communication skills.",
        "Describe how businesses are structured and operated.",
        "Design a business plan.",
        "Weigh financial risks and rewards."
      ],
      parts: [{ name: "Semester A", units: BIZ_A }, { name: "Semester B", units: BIZ_B }],
      grading: [["Quizzes", 50], ["Written assignments", 20], ["Midterm and final exams", 30]],
      textbook: "Introduction to Business \u2014 Boundless, CC\u00A0BY-SA\u00A04.0.",
      glyph: '<path d="M3 20h18M6 20V9l6-4 6 4v11"/><path d="M10 20v-5h4v5"/>'
    }
  ];

  /* -------------------------------------------------------------- State */
  var FILTER = null;
  var S = { course: null, unit: 0, i: 0, picked: null, checked: false, right: 0, first: 0, tries: 0, done: 0 };

  function show(v) {
    ["home", "course", "lesson", "done"].forEach(function (n) {
      $("#v-" + n).classList.toggle("on", n === v);
    });
    $("#back").hidden = (v === "home");
    $("#barProg").hidden = (v !== "lesson");
    $("#subjWrap").hidden = (v === "lesson");
    $("#barName").textContent =
      v === "lesson" ? "Counting in shapes" : v === "course" && S.course ? S.course.t : "Oplo Learn";
    window.scrollTo(0, 0);
  }

  /* --------------------------------------------------------------- Home */
  function drawHome() {
    var pct = Math.round(S.done / PROBLEMS.length * 100);
    $("#resume").innerHTML =
      '<div class="t"><span class="k">Continue</span><b>Counting in shapes</b>' +
      '<p>Seeing numbers &middot; ' + (S.done ? S.done + " of " + PROBLEMS.length + " done" : "5 problems, about 5 minutes") + '</p></div>' +
      '<button class="lx-btn" id="resumeGo">' + (S.done ? "Keep going" : "Start") + '</button>';
    $("#resumeGo").addEventListener("click", function () { openCourse(COURSES[0]); startLesson(); });

    var head = $("#filterHead");
    if (FILTER) {
      head.hidden = false;
      head.innerHTML = '<h2>' + FILTER + '</h2><button type="button" id="clearFilter">Show all courses</button>';
      $("#clearFilter").addEventListener("click", function () { FILTER = null; drawHome(); drawSubjects(); });
    } else {
      head.hidden = true;
      head.innerHTML = "";
    }

    var box = $("#courses"); box.innerHTML = "";
    COURSES.filter(function (c) { return !FILTER || c.subject === FILTER; }).forEach(function (c) {
      var p = c.id === "seeing" ? pct : 0;
      var b = el("button", "lx-card");
      b.type = "button";
      b.innerHTML =
        '<span class="lx-glyph" style="background:' + c.hue + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + c.glyph + '</svg>' +
        '</span>' +
        '<b>' + c.t + '</b><span class="d">' + c.d + '</span>' +
        '<span class="lx-meta"><span class="lx-track' + (p === 100 ? " done" : "") + '"><i style="width:' + p + '%"></i></span>' +
        '<span>' + (c.units ? p + "%" : countUnits(c) + " units") + '</span></span>';
      b.addEventListener("click", function () { openCourse(c); });
      box.appendChild(b);
    });
  }

  /* ----------------------------------------------------------- Subjects */
  function subjects() {
    var seen = [], map = {};
    COURSES.forEach(function (c) {
      if (!map[c.subject]) { map[c.subject] = { n: c.subject, hue: c.hue, count: 0 }; seen.push(map[c.subject]); }
      map[c.subject].count++;
    });
    return seen;
  }

  function drawSubjects() {
    var m = $("#subjMenu");
    m.innerHTML = "";
    var all = document.createElement("button");
    all.type = "button";
    all.setAttribute("role", "menuitem");
    all.setAttribute("aria-current", String(!FILTER));
    all.innerHTML = '<span class="n">All courses</span><span class="c">' + COURSES.length + '</span>';
    all.addEventListener("click", function () { pick(null); });
    m.appendChild(all);
    m.appendChild(document.createElement("hr"));
    subjects().forEach(function (sub) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      b.setAttribute("aria-current", String(FILTER === sub.n));
      b.innerHTML = '<span class="sw" style="background:' + sub.hue + '"></span>' +
                    '<span class="n">' + sub.n + '</span><span class="c">' + sub.count + '</span>';
      b.addEventListener("click", function () { pick(sub.n); });
      m.appendChild(b);
    });
  }

  function pick(name) {
    FILTER = name;
    closeMenu();
    drawSubjects();
    drawHome();
    show("home");
  }
  function openMenu() {
    $("#subjMenu").hidden = false;
    $("#subjBtn").setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    $("#subjMenu").hidden = true;
    $("#subjBtn").setAttribute("aria-expanded", "false");
  }
  $("#subjBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    if ($("#subjMenu").hidden) openMenu(); else closeMenu();
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#subjWrap")) closeMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });
  $("#user").addEventListener("click", function () {
    flash("Signed in as Saswat Ji — demo account, nothing is stored");
  });

  /* ------------------------------------------------------------- Course */
  function openCourse(c) {
    S.course = c;
    $("#courseTitle").textContent = c.t;
    $("#courseLede").textContent = c.lede || c.d;
    var body = $("#courseBody");
    body.innerHTML = "";

    var playable = (c.units || []).some(function (u) { return u.play; });
    var pct = playable ? Math.round(S.done / PROBLEMS.length * 100) : 0;

    if (playable) {
      var m = el("div", "lx-meta");
      m.style.cssText = "max-width:340px;margin:18px 0 6px";
      m.innerHTML = '<span class="lx-track' + (pct === 100 ? " done" : "") +
                    '"><i style="width:' + pct + '%"></i></span><span>' + pct + '%</span>';
      body.appendChild(m);
    } else if (c.tag) {
      var t = el("p", "lx-meta");
      t.style.cssText = "margin:18px 0 6px";
      t.innerHTML = '<span class="lx-tag">' + c.tag + '</span>' +
                    '<span>' + countUnits(c) + ' units</span>';
      body.appendChild(t);
    }

    if (c.objectives) {
      var o = el("section", "lx-sec", "<h2>What you will be able to do</h2>");
      var ul = el("ul", "lx-obj");
      c.objectives.forEach(function (x) {
        ul.appendChild(el("li", null,
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" ' +
          'stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 6.5 12 13 4.5"/></svg>' +
          '<span>' + x + '</span>'));
      });
      o.appendChild(ul);
      body.appendChild(o);
    }

    var sec = el("section", "lx-sec", "<h2>Contents</h2>");
    if (c.units && c.units.length) {
      sec.appendChild(unitList(c.units, true));
    } else {
      var n = 0;
      c.parts.forEach(function (part) {
        if (part.name) sec.appendChild(el("p", "lx-part", part.name));
        var wrap = el("div", "lx-units");
        part.units.forEach(function (u) {
          n++;
          var b = el("button", "lx-unit");
          b.type = "button";
          b.innerHTML = '<span class="lx-step">' + n + '</span>' +
                        '<span class="t"><b>' + u + '</b></span>' +
                        '<span class="lx-tag">Soon</span>';
          b.addEventListener("click", function () { flash(u + " — not written yet"); });
          wrap.appendChild(b);
        });
        sec.appendChild(wrap);
      });
    }
    body.appendChild(sec);

    if (c.grading) {
      var g = el("section", "lx-sec", "<h2>Assessment</h2>");
      var box = el("div", "lx-grade");
      c.grading.forEach(function (row) {
        box.appendChild(el("div", "g",
          '<span>' + row[0] + '</span>' +
          '<span class="bar"><i style="width:' + row[1] + '%"></i></span>' +
          '<b>' + row[1] + '%</b>'));
      });
      g.appendChild(box);
      var sc = el("div", "lx-scale");
      SCALE.forEach(function (x) { sc.appendChild(el("span", null, "<b>" + x[0] + "</b> " + x[1])); });
      g.appendChild(sc);
      body.appendChild(g);
    }

    if (c.textbook) {
      body.appendChild(el("p", "lx-credit", "Textbook: " + c.textbook));
    }
    show("course");
  }

  function countUnits(c) {
    return (c.parts || []).reduce(function (n, p) { return n + p.units.length; }, 0);
  }

  function unitList(units, live) {
    var wrap = el("div", "lx-units");
    var pct = Math.round(S.done / PROBLEMS.length * 100);
    units.forEach(function (u, i) {
      var state = !u.play ? "" : pct === 100 ? "done" : "now";
      var b = el("button", "lx-unit " + state);
      b.type = "button";
      if (!u.play) b.disabled = true;
      b.innerHTML = '<span class="lx-step">' + (state === "done" ? "&#10003;" : (i + 1)) + '</span>' +
                    '<span class="t"><b>' + u.t + '</b><span>' + u.s + '</span></span>' +
                    '<span class="lx-tag' + (state ? " " + state : "") + '">' +
                    (state === "done" ? "Mastered" : state === "now" ? (S.done ? "In progress" : "Start") : "Locked") +
                    '</span>';
      if (u.play) b.addEventListener("click", startLesson);
      wrap.appendChild(b);
    });
    return wrap;
  }

  var flashTimer;
  function flash(msg) {
    var n = document.getElementById("lxFlash") || (function () {
      var d = el("div", null, "");
      d.id = "lxFlash";
      d.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(12px);" +
        "background:#1d1d1f;color:#fff;font-size:14px;padding:11px 20px;border-radius:100px;" +
        "opacity:0;transition:opacity .2s,transform .2s;z-index:60;pointer-events:none";
      document.body.appendChild(d);
      return d;
    })();
    n.textContent = msg;
    n.style.opacity = "1";
    n.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () {
      n.style.opacity = "0";
      n.style.transform = "translateX(-50%) translateY(12px)";
    }, 2000);
  }

  /* ------------------------------------------------------------- Lesson */
  function startLesson() {
    S.i = 0; S.right = 0; S.first = 0; S.tries = 0; S.done = 0;
    show("lesson"); drawProblem();
  }

  function drawProblem() {
    var p = PROBLEMS[S.i];
    S.picked = null; S.checked = false; S.tries = 0;
    $("#barProg").firstElementChild.style.width = (S.i / PROBLEMS.length * 100) + "%";
    $("#ask").innerHTML = p.ask;
    $("#hint").innerHTML = p.hint || "";
    $("#hint").hidden = !p.hint;
    var fig = $("#figure");
    fig.hidden = !p.fig;
    fig.innerHTML = p.fig || "";
    $("#verdict").innerHTML = "";

    var a = $("#answer"); a.innerHTML = "";
    if (p.type === "choice") {
      var wrap = el("div", "lx-opts");
      p.opts.forEach(function (o, i) {
        var b = el("button", "lx-opt");
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.innerHTML = '<span class="lx-key">' + "ABCD"[i] + '</span><span>' + o + '</span>';
        b.addEventListener("click", function () {
          if (S.checked) return;
          S.picked = i;
          [].forEach.call(wrap.children, function (c, j) { c.setAttribute("aria-pressed", String(i === j)); });
          $("#check").disabled = false;
        });
        wrap.appendChild(b);
      });
      a.appendChild(wrap);
    } else {
      var w = el("div", "lx-numwrap");
      var inp = el("input", "lx-num");
      inp.type = "text"; inp.inputMode = "numeric"; inp.id = "numIn";
      inp.setAttribute("aria-label", "Your answer");
      inp.addEventListener("input", function () {
        S.picked = inp.value.trim();
        $("#check").disabled = !S.picked;
      });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !$("#check").disabled) check(); });
      w.appendChild(inp);
      a.appendChild(w);
      setTimeout(function () { inp.focus(); }, 60);
    }
    $("#check").disabled = true;
    $("#check").textContent = "Check";
  }

  function check() {
    var p = PROBLEMS[S.i];

    if (S.checked) {                       // second press = advance
      S.i++;
      if (S.i >= PROBLEMS.length) finish(); else drawProblem();
      return;
    }

    S.tries++;
    var ok = p.type === "choice"
      ? S.picked === p.right
      : String(S.picked).replace(/\s/g, "") === String(p.right);

    if (!ok && S.tries === 1) {            // one free retry, then the answer
      markWrong(p);
      $("#verdict").innerHTML =
        '<div class="lx-verdict wrong"><b>Not quite</b><p>Have another look &mdash; you get one more try.</p></div>';
      return;
    }

    S.checked = true;
    S.done++;
    if (ok) { S.right++; if (S.tries === 1) S.first++; }
    reveal(p, ok);
    $("#check").disabled = false;
    $("#check").textContent = S.i === PROBLEMS.length - 1 ? "Finish" : "Next";
    $("#barProg").firstElementChild.style.width = ((S.i + 1) / PROBLEMS.length * 100) + "%";
  }

  function markWrong(p) {
    if (p.type === "choice") {
      var opts = $("#answer").querySelectorAll(".lx-opt");
      opts[S.picked].classList.add("wrong");
      opts[S.picked].setAttribute("aria-pressed", "false");
      S.picked = null;
      $("#check").disabled = true;
    } else {
      $("#numIn").classList.add("wrong");
    }
  }

  function reveal(p, ok) {
    if (p.type === "choice") {
      var opts = $("#answer").querySelectorAll(".lx-opt");
      [].forEach.call(opts, function (o, i) {
        o.disabled = true;
        if (i === p.right) o.classList.add("right");
      });
    } else {
      var n = $("#numIn");
      n.classList.remove("wrong");
      n.classList.add(ok ? "right" : "wrong");
      n.disabled = true;
      if (!ok) n.value = p.right;
    }
    $("#verdict").innerHTML =
      '<div class="lx-verdict ' + (ok ? "right" : "wrong") + '">' +
      '<b>' + (ok ? "That's it" : "The answer is " + (p.type === "choice" ? p.opts[p.right] : p.right)) + '</b>' +
      '<p>' + p.why + '</p></div>';
  }

  function finish() {
    var pct = Math.round(S.right / PROBLEMS.length * 100);
    $("#sRight").textContent = S.right;
    $("#sTotal").textContent = PROBLEMS.length;
    $("#sFirst").textContent = S.first;
    $("#ringPct").textContent = pct + "%";
    $("#doneLede").textContent = pct === 100
      ? "Every one. The next unit would open here."
      : "The ones you missed come back later, spaced out, until they stop being misses.";
    show("done");
    setTimeout(function () {
      $("#ringArc").style.strokeDashoffset = String(327 - 327 * pct / 100);
    }, 120);
  }

  /* ------------------------------------------------------------- Wiring */
  $("#check").addEventListener("click", check);
  $("#doneNext").addEventListener("click", function () { openCourse(S.course || COURSES[0]); });
  $("#back").addEventListener("click", function () {
    if ($("#v-lesson").classList.contains("on") || $("#v-done").classList.contains("on")) openCourse(S.course || COURSES[0]);
    else { drawHome(); show("home"); }
  });

  drawSubjects();
  drawHome();
  show("home");
})();
