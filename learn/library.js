/* ==========================================================================
   Library — published content available to browse.

   Courses and study sets that are published and open. This is where a
   student goes to find something new: a course they are not yet
   enrolled in, or a study set written for one they are.
   ========================================================================== */
(function () {
  "use strict";

  var API = window.OPLO_API;
  var S = window.OPLO ? window.OPLO.S : null;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function drawLibrary() {
    var v = document.getElementById("v-library");
    if (!v) return;
    v.innerHTML = "";
    v.appendChild(el("p", "lx-hello", S && S.me ? "Browse what is published." : "Sign in to browse published content."));
    v.appendChild(el("h1", "lx-h1", "Library"));

    /* Tabs */
    var tabs = el("nav", "lx-subbar-in", "");
    tabs.style.borderBottom = "1px solid var(--hair)";
    tabs.style.height = "auto";
    tabs.style.padding = "8px 0";
    var tabCourses = el("button", null, "Courses");
    tabCourses.type = "button";
    tabCourses.style.cssText = "height:30px;padding:0 12px;border-radius:100px;font-size:13.5px;font-weight:500;color:var(--ink);background:var(--sunk);";
    var tabSets = el("button", null, "Study sets");
    tabSets.type = "button";
    tabSets.style.cssText = "height:30px;padding:0 12px;border-radius:100px;font-size:13.5px;font-weight:500;color:var(--ink-2);";
    tabs.appendChild(tabCourses);
    tabs.appendChild(tabSets);
    v.appendChild(tabs);

    var content = el("div");
    v.appendChild(content);

    tabCourses.addEventListener("click", function () {
      tabCourses.style.background = "var(--sunk)";
      tabCourses.style.color = "var(--ink)";
      tabSets.style.background = "none";
      tabSets.style.color = "var(--ink-2)";
      drawCourses(content);
    });
    tabSets.addEventListener("click", function () {
      tabSets.style.background = "var(--sunk)";
      tabSets.style.color = "var(--ink)";
      tabCourses.style.background = "none";
      tabCourses.style.color = "var(--ink-2)";
      drawSets(content);
    });

    drawCourses(content);
  }

  function drawCourses(host) {
    host.innerHTML = "";
    host.appendChild(el("h2", "lx-h2", "Published courses"));
    var grid = el("div", "lx-grid");
    host.appendChild(grid);

    API.courses.all().then(function (rows) {
      if (!rows.length) {
        grid.innerHTML = '<div class="lx-pending" style="grid-column:1/-1"><b>Nothing published yet</b><p>Courses will appear here as they are published.</p></div>';
        return;
      }
      rows.forEach(function (c) {
        grid.appendChild(courseCard(c));
      });
    }, function () {
      grid.innerHTML = '<div class="lx-pending" style="grid-column:1/-1"><b>Could not load</b><p>Check your connection.</p></div>';
    });
  }

  function courseCard(c) {
    var card = el("button", "lx-card");
    card.type = "button";
    var ic = el("span", "ic");
    ic.style.background = (c.hue || "#0071e3") + "1a";
    ic.style.color = c.hue || "#0071e3";
    ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h18M3 7l4-4h10l4 4M5 7v13h14V7"/><path d="M9 11h6"/></svg>';
    card.appendChild(ic);
    var body = el("div");
    body.appendChild(el("h3", null, esc(c.title)));
    body.appendChild(el("p", null, esc(c.subject || "") + " · " + esc(c.level || "") + (c.summary ? " · " + esc(c.summary.slice(0, 80)) : "")));
    card.appendChild(body);
    var foot = el("div", "foot");
    foot.innerHTML = '<span class="lx-tag">' + esc(c.status || "published") + '</span>';
    if (c.units) {
      var cnt = el("span", null, c.units + " units");
      cnt.style.marginLeft = "auto";
      cnt.style.fontSize = "12.5px";
      cnt.style.color = "var(--ink-3)";
      foot.appendChild(cnt);
    }
    card.appendChild(foot);
    card.addEventListener("click", function () {
      if (window.OPLO_APP) window.OPLO_APP.showClassHomeById(c.id);
    });
    return card;
  }

  function drawSets(host) {
    host.innerHTML = "";
    host.appendChild(el("h2", "lx-h2", "Published study sets"));
    var grid = el("div", "lx-grid");
    host.appendChild(grid);

    API.studySets.mine().then(function (rows) {
      if (!rows.length) {
        grid.innerHTML = '<div class="lx-pending" style="grid-column:1/-1"><b>Nothing yet</b><p>Study sets appear here as they are published.</p></div>';
        return;
      }
      rows.forEach(function (s) {
        grid.appendChild(setCard(s));
      });
    }, function () {
      grid.innerHTML = '<div class="lx-pending" style="grid-column:1/-1"><b>Could not load</b><p>Check your connection.</p></div>';
    });
  }

  function setCard(s) {
    var card = el("button", "lx-card");
    card.type = "button";
    var ic = el("span", "ic");
    ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 4h11a2 2 0 0 1 2 2v10"/></svg>';
    card.appendChild(ic);
    var body = el("div");
    body.appendChild(el("h3", null, esc(s.title || s.t)));
    var deep = (s.terms || s.rich || []).filter(function (t) { return (t.levels || "").indexOf("apply") > -1; }).length;
    var subText = (s.cards || []).length + " terms" + (deep ? " · " + deep + " with a worked case" : "");
    body.appendChild(el("span", null, subText));
    card.appendChild(body);
    var foot = el("div", "foot");
    foot.innerHTML = '<span class="lx-tag">' + esc(s.status || "published") + '</span>';
    if (s.courseTitle) {
      var course = el("span", null, s.courseTitle);
      course.style.marginLeft = "auto";
      course.style.fontSize = "12.5px";
      course.style.color = "var(--ink-3)";
      foot.appendChild(course);
    }
    card.appendChild(foot);
    card.addEventListener("click", function () {
      if (window.OPLO_APP && s.id) window.OPLO_APP.openSet(s.id);
    });
    return card;
  }

  window.OPLO_LIBRARY = { draw: drawLibrary };
})();
