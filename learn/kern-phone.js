/* ==========================================================================
   Kern's pages for a phone.

   Not the laptop's pages made smaller: pages drawn for a thumb and a short
   visit. One idea runs through them: the next step is the biggest thing on the
   screen, and everything else is a quiet list under it. Colour is for place
   (each subject has a hue and its page wears it); there are no boxes inside
   boxes; a page is a column you scroll.

   app.js hands a page over when the window is a phone's (see phoneOn() there)
   along with the few things a page needs. The laptop's pages are untouched.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_KERN) return;

  var mq = window.matchMedia("(max-width: 700px)");
  var K = window.KERN_PHONE = { on: function () { return mq.matches; } };

  var CHEV = '<i class="kx-chev" aria-hidden="true"></i>';
  var LENS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';

  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function hue(o) { return (o && o.hue) || "#8d9bff"; }
  function btn(cls, text, fn) {
    var b = h("button", cls, text);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }

  /* A course, as a row: its picture, its name, how many units and how far, then
     a ring (if you have begun) or an arrow. */
  function courseRow(x, c) {
    var li = h("li"), b = h("button", "kx-row"), n = x.units(c).length, p = c.stub ? 0 : x.pct(c);
    b.type = "button";
    b.style.setProperty("--h", hue(c));
    b.innerHTML = '<span class="kx-ic">' + x.svg(c.glyph, true) + "</span>" +
      '<span class="kx-tx"><b>' + x.esc(c.t) + "</b><small>" + (c.stub ? "Coming soon" : plural(n, "unit") + (p ? " · " + p + "%" : "")) + "</small></span>" +
      (c.stub ? "" : p ? '<i class="kx-ring" style="--p:' + p + '" aria-hidden="true"></i>' : CHEV);
    b.addEventListener("click", function () {
      if (c.stub) x.toast("“" + c.t + "” isn’t written yet."); else x.openCourse(c);
    });
    li.appendChild(b);
    return li;
  }

  /* Look a course up by what you remember of it. */
  function finder(x) {
    var box = h("div", "kx-find");
    box.innerHTML = '<label class="kx-search">' + LENS + '<input type="search" placeholder="Search courses" aria-label="Search courses" autocomplete="off" spellcheck="false"></label><ul class="kx-rows kx-hits"></ul>';
    var input = box.querySelector("input"), hits = box.querySelector(".kx-hits");
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      hits.innerHTML = "";
      box.classList.toggle("on", !!q);
      if (!q) return;
      var found = x.courses().filter(function (c) {
        return !c.stub && (c.t + " " + (c.subject || "") + " " + (c.d || "")).toLowerCase().indexOf(q) > -1;
      }).slice(0, 8);
      if (!found.length) { hits.innerHTML = '<li class="kx-none">Nothing called that yet. Try “algebra”, “biology” or “business”.</li>'; return; }
      found.forEach(function (c) { hits.appendChild(courseRow(x, c)); });
    });
    return box;
  }

  /* The unit to do next in a course: one not yet mastered, else the first you can open. */
  function upNext(x, c) {
    var us = x.units(c), live = function (u) { return u.play || u.set || u.lab || u.read; };
    return us.filter(function (u) { return live(u) && x.mastery(c, u.n) < 85; })[0] || us.filter(live)[0] || us[0];
  }

  /* ------------------------------------------------------------------ Home
     What to do now, how the week is going, your courses, and a way to find more. */
  K.home = function (x) {
    var v = x.$("#v-my"), g = x.R.d.game, mine = x.own(), step = x.next(mine), wk = x.G.week(x.R, x.ST);
    v.innerHTML = "";
    var root = h("div", "kx kx-home");
    v.appendChild(root);
    root.appendChild(h("p", "kx-hi", "Hi, " + x.esc(x.S.me.first)));

    var now = h("section", "kx-now kx-bleed");
    if (step) {
      var c = step.course, t = step.weak ? x.units(c).filter(function (u) { return u.n === step.weak.n; })[0] || step.unit : step.unit;
      now.style.setProperty("--h", hue(c));
      now.innerHTML = '<p class="kx-kick">' + x.esc(c.t) + " · Unit " + t.n + '</p><h1 class="kx-display">' + x.esc(t.t) + "</h1>" +
        '<p class="kx-meta">Unit ' + t.n + " of " + x.units(c).length + " · " + x.pct(c) + "% of the course</p>";
      now.appendChild(btn("kx-cta", step.pct ? "Continue" : "Start", function () { x.openUnit(c, t.n); }));
    } else {
      now.innerHTML = '<h1 class="kx-display">What do you want to learn?</h1><p class="kx-meta">Pick a course. Nothing is graded.</p>';
      now.appendChild(btn("kx-cta", "Browse courses", function () { x.explore(); }));
    }
    root.appendChild(now);

    // The week: a streak, seven dots, today's goal. One band, no card.
    var wkEl = h("section", "kx-week");
    wkEl.innerHTML = '<p class="kx-streak"><b>' + g.streak + "</b> " + (g.streak === 1 ? "day" : "days") + " in a row</p>" +
      '<ol class="kx-days">' + wk.map(function (d, i) {
        return '<li class="' + (d.xp ? "on" : "") + (i === 6 ? " today" : "") + '" title="' + x.esc(d.day + " — " + d.xp + " XP") + '"><i></i><span>' + x.esc(d.label) + "</span></li>";
      }).join("") + "</ol>" +
      '<p class="kx-xp">' + g.today + " of " + g.goal + " XP today</p>";
    root.appendChild(wkEl);

    if (mine.length) {
      root.appendChild(h("h2", "kx-h", "Your courses"));
      var ul = h("ul", "kx-rows");
      mine.forEach(function (c2) { ul.appendChild(courseRow(x, c2)); });
      root.appendChild(ul);
    }

    root.appendChild(h("h2", "kx-h", "Find something new"));
    root.appendChild(finder(x));
    var chips = h("div", "kx-chips");
    x.SC.subjects().forEach(function (s) { chips.appendChild(btn("kx-chip", x.esc(s.n), function () { x.openSubject(s); })); });
    root.appendChild(chips);

    if (x.S.mistakes.length) {
      root.appendChild(btn("kx-link kx-wrong", "What you keep getting wrong · " + x.S.mistakes.length + " ›", function () { x.openMistakes(); }));
    }
  };

  /* --------------------------------------------------------------- Courses
     Subjects, one open at a time: a short page that opens where you look. */
  function subjectIcon(x, s) {
    var c = s.courses.filter(function (k) { return k.glyph; })[0];
    return x.svg(c ? c.glyph : '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.2"/>', true);
  }
  K.explore = function (x) {
    var v = x.$("#v-explore"), step = x.next(x.own()), mineSubject = step && step.course.subject;
    v.innerHTML = "";
    var root = h("div", "kx kx-courses");
    v.appendChild(root);
    root.appendChild(h("h1", "kx-title", "Courses"));
    root.appendChild(finder(x));
    var list = h("div", "kx-subs");
    x.SC.subjects().forEach(function (s) {
      var d = h("details", "kx-sub"), live = s.courses.filter(function (c) { return !c.stub; });
      d.style.setProperty("--h", hue(s));
      if (s.n === mineSubject) d.open = true;
      d.innerHTML = '<summary><span class="kx-ic">' + subjectIcon(x, s) + '</span><span class="kx-tx"><b>' + x.esc(s.n) + "</b><small>" +
        plural(live.length, "course") + (live.length < s.courses.length ? " · " + (s.courses.length - live.length) + " soon" : "") + "</small></span>" + CHEV + "</summary>";
      var ul = h("ul", "kx-rows");
      s.courses.forEach(function (c) { ul.appendChild(courseRow(x, c)); });
      d.appendChild(ul);
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        [].forEach.call(list.children, function (o) { if (o !== d) o.open = false; });
      });
      list.appendChild(d);
    });
    root.appendChild(list);
  };

  /* --------------------------------------------------------------- Subject */
  K.subject = function (x, s) {
    var v = x.$("#v-subject");
    v.innerHTML = "";
    var root = h("div", "kx kx-subject");
    root.style.setProperty("--h", hue(s));
    v.appendChild(root);
    root.appendChild(btn("kx-back", "Courses", function () { x.explore(); }));
    var hero = h("header", "kx-hero kx-bleed");
    hero.innerHTML = '<span class="kx-bigic">' + subjectIcon(x, s) + '</span><h1 class="kx-display">' + x.esc(s.n) + '</h1><p class="kx-lede">' + x.esc(s.d) + "</p>";
    root.appendChild(hero);
    var ul = h("ul", "kx-rows");
    s.courses.forEach(function (c) { ul.appendChild(courseRow(x, c)); });
    root.appendChild(ul);
  };

  /* ---------------------------------------------------------------- Course
     Its colour, one button, then its units down a line you walk. */
  K.course = function (x, c) {
    var v = x.$("#v-course"), units = x.units(c), A = window.KERN_ART, pct = x.pct(c), nxt = upNext(x, c);
    var live = function (u) { return u.play || u.set || u.lab || u.read; };
    v.innerHTML = "";
    var root = h("div", "kx kx-course");
    root.style.setProperty("--h", hue(c));
    v.appendChild(root);
    var subj = x.subjectOf(c);
    root.appendChild(btn("kx-back", x.esc(c.subject || "Courses"), function () { if (subj) x.openSubject(subj); else x.explore(); }));

    var hero = h("header", "kx-hero kx-bleed");
    hero.innerHTML = '<span class="kx-bigic">' + x.svg(c.glyph, true) + '</span><h1 class="kx-display">' + x.esc(c.t) + "</h1>" +
      '<p class="kx-lede">' + x.esc(c.d || c.lede || "") + "</p>" +
      '<p class="kx-meta">' + plural(units.length, "unit") + (c.level ? " · " + x.esc(c.level) : "") + " · " + pct + "% mastered</p>";
    if (nxt) hero.appendChild(btn("kx-cta", (pct ? "Continue · Unit " : "Start · Unit ") + nxt.n, function () { x.openUnit(c, nxt.n); }));
    if (x.S.me && !document.body.classList.contains("is-staff") && x.R) {
      var on = x.R.own().indexOf(c.id) > -1, add = btn("kx-link", on ? "On your list ✓" : "Add to my courses", function () {
        if (x.R.own().indexOf(c.id) > -1) { x.R.drop(c.id); add.textContent = "Add to my courses"; x.toast("Taken off your list."); }
        else { x.R.adopt(c.id); add.textContent = "On your list ✓"; x.toast("Added to your courses."); }
      });
      hero.appendChild(add);
    }
    root.appendChild(hero);

    root.appendChild(h("h2", "kx-h", "Units"));
    var ol = h("ol", "kx-rail");
    units.forEach(function (u) {
      var m = x.mastery(c, u.n), soon = !live(u), cur = nxt && u.n === nxt.n;
      var li = h("li", (m >= 85 ? "done " : "") + (cur ? "cur " : "") + (soon ? "soon" : "")), b = h("button", "kx-step");
      b.type = "button";
      b.innerHTML = A.pad(u.art, u.n) + '<span class="kx-tx"><b>' + x.esc(u.t) + "</b><small>" + (soon ? "Coming soon" : "Unit " + u.n + (m ? " · " + m + "%" : "")) + "</small></span>";
      b.addEventListener("click", function () { x.openUnit(c, u.n); });
      li.appendChild(b);
      ol.appendChild(li);
    });
    root.appendChild(ol);

    if (c.lab && window.OPLO_LAB) root.appendChild(btn("kx-ghost", "Course challenge · two problems from every unit", function () { x.openLab(c, null, "Challenge"); }));
    function fold(title, body) {
      var d = h("details", "kp-fold kx-fold", "<summary><h2>" + title + "</h2></summary>" + body);
      root.appendChild(d);
    }
    if (c.grownup) fold("For the grown-up", "<p>" + x.esc(c.grownup) + "</p>");
    if (c.objectives || c.textbook) {
      fold("What you will be able to do", (c.objectives ? "<ul>" + c.objectives.map(function (t) { return "<li>" + x.esc(t) + "</li>"; }).join("") + "</ul>" : "") +
        (c.textbook ? "<p>" + x.esc(c.textbook) + "</p>" : ""));
    }
  };

  /* ------------------------------------------------------------------ Unit
     The unit's own page is drawn by the lab; on a phone it is given its subject's
     colour (the page's style does the rest). */
  K.unit = function (v, c) {
    v.classList.add("kx-unit");
    v.style.setProperty("--h", hue(c));
  };

  /* ---------------------------------------------------------------- Progress
     progress.js draws a flat run of headings and blocks. On a phone the glance
     comes first (this week, today), then what you have mastered, then badges,
     which sit under a heading you tap. */
  function tidyProgress() {
    var v = document.getElementById("v-progress");
    if (!v || !mq.matches || v.querySelector(":scope > .kx-psec")) return;
    var kids = [].slice.call(v.children), secs = {}, order = ["this week", "today's goal", "mastery by subject", "badges"], cur = null;
    if (!kids.some(function (e) { return e.matches("h2.lx-h2"); })) return;
    kids.forEach(function (e) {
      if (e.matches("h2.lx-h2")) {
        cur = h("section", "kx-psec");
        secs[e.textContent.trim().toLowerCase()] = cur;
        cur.appendChild(e);
        cur.setAttribute("data-k", e.textContent.trim().toLowerCase());
      } else if (cur) cur.appendChild(e);
    });
    // This week as seven columns (height is XP), not seven rows.
    var week = secs["this week"], bars = week && week.querySelector(".lx-bars");
    if (bars) {
      var rows = [].map.call(bars.querySelectorAll(".lx-barrow"), function (r) {
        var d = r.querySelector("b"), pc = r.querySelector(".pc");
        return { d: d ? d.textContent.trim() : "", xp: pc ? parseInt(pc.textContent, 10) || 0 : 0 };
      }), max = Math.max.apply(null, rows.map(function (r) { return r.xp; }).concat([1]));
      var chart = h("ol", "kx-chart" + (max === 1 && !rows.some(function (r) { return r.xp; }) ? " none" : ""));
      rows.forEach(function (r) {
        chart.appendChild(h("li", r.xp ? "on" : "", '<span class="kx-n">' + (r.xp || "") + '</span><span class="kx-bar"><i style="height:' + Math.max(6, Math.round(r.xp / max * 100)) + '%"></i></span><span class="kx-d">' + r.d + "</span>"));
      });
      bars.parentNode.replaceChild(chart, bars);
    }
    var badges = secs.badges;
    if (badges) {
      var head = badges.querySelector("h2"), d = h("details", "kp-fold"), sum = h("summary");
      var n = badges.querySelectorAll(".lx-card").length;
      if (n) { var c = h("span", null, String(n)); head.appendChild(c); }
      sum.appendChild(head);
      d.appendChild(sum);
      while (badges.firstChild) d.appendChild(badges.firstChild);
      badges.appendChild(d);
    }
    order.forEach(function (k) { if (secs[k]) v.appendChild(secs[k]); });
    Object.keys(secs).forEach(function (k) { if (order.indexOf(k) < 0) v.appendChild(secs[k]); });
  }
  (function watch() {
    var v = document.getElementById("v-progress");
    if (!v) return;
    var queued = false, obs = new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; tidyProgress(); });
    });
    obs.observe(v, { childList: true });
    tidyProgress();
  })();

  /* What to do next, for the menu: the same answer Home gives. */
  K.nextUp = function () {
    var x = K.ctx && K.ctx();
    if (!x || !x.R) return null;
    var step = x.next(x.own());
    if (!step) return null;
    var c = step.course, t = step.weak ? x.units(c).filter(function (u) { return u.n === step.weak.n; })[0] || step.unit : step.unit;
    return {
      label: step.pct ? "Continue" : "Start", course: c.t, unit: "Unit " + t.n + " · " + t.t, icon: x.svg(c.glyph, true), hue: hue(c),
      go: function () { x.openUnit(c, t.n); }
    };
  };
})();
