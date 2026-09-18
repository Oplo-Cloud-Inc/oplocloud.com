/* ==========================================================================
   Assignments — all assigned work, across all courses.

   This is the student's work list: everything that has been set, in
   one place, sorted by what is most urgent. A grade that exists but
   has not been handed back is not the same as work that is still owed,
   and only the second can be fixed.
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
  function dayName(d) {
    if (!d) return "no date";
    var dt = new Date(d);
    var days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return days[dt.getDay()] + " " + (dt.getMonth() + 1) + "/" + dt.getDate();
  }

  function drawAssignments() {
    var v = document.getElementById("v-assignments");
    if (!v) return;
    v.innerHTML = "";
    v.appendChild(el("p", "lx-hello", S && S.me ? "Here is what has been set for you." : ""));
    v.appendChild(el("h1", "lx-h1", "Assignments"));

    var list = el("div", "lx-grid");
    v.appendChild(list);

    API.assignments.all().then(function (work) {
      if (!work || !work.length) {
        list.innerHTML = '<div class="lx-pending" style="grid-column:1/-1"><b>Nothing set</b><p>Your teachers have not set any work yet.</p></div>';
        return;
      }

      /* Sort by due date, overdue first */
      var now = Date.now();
      work.sort(function (a, b) {
        var da = a.dueAt || Number.MAX_SAFE_INTEGER;
        var db = b.dueAt || Number.MAX_SAFE_INTEGER;
        return da - db;
      });

      work.forEach(function (w) {
        var overdue = w.dueAt && w.dueAt < now && !w.status;
        var card = el("button", "lx-card" + (w.status === "missing" ? " " : " "));
        card.type = "button";
        if (w.status === "marked" && w.score != null) {
          card.style.borderLeft = "4px solid " + (w.score >= (w.outOf || 100) * 0.85 ? "#12915a" : w.score >= (w.outOf || 100) * 0.6 ? "#b26a00" : "#d70015");
        }
        var ic = el("span", "ic");
        ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h8L18 7v13.5H6z"/><path d="M13.5 3.5V7H18"/><path d="M9 12.5h6"/></svg>';
        card.appendChild(ic);

        var body = el("div");
        var title = el("b", null, esc(w.title));
        var sub = el("span", null, esc(w.courseTitle || "") + " · out of " + (w.outOf || 100));
        body.appendChild(title);
        body.appendChild(sub);
        card.appendChild(body);

        var foot = el("div", "foot");
        var statusText = w.status === "missing" ? "Not handed in"
          : w.status === "excused" ? "Excused"
          : w.status === "marked" && w.score != null ? w.score + " / " + w.outOf
          : "Not marked yet";
        var tag = el("span", "lx-tag " + (w.status === "marked" ? "live" : w.status === "missing" ? "" : "soon"), statusText);
        foot.appendChild(tag);
        if (w.dueAt) {
          var due = el("span", null, "Due " + dayName(w.dueAt));
          due.style.marginLeft = "auto";
          due.style.fontSize = "12.5px";
          due.style.color = overdue ? "var(--red)" : "var(--ink-3)";
          foot.appendChild(due);
        }
        card.appendChild(foot);

        if (overdue) {
          var warn = el("p", null, "");
          warn.style.cssText = "margin-top:8px;font-size:13px;color:var(--red);";
          warn.textContent = "Past due";
          card.appendChild(warn);
        }

        card.addEventListener("click", function () {
          if (window.OPLO_APP && w.courseId) window.OPLO_APP.openCourseById(w.courseId);
        });

        list.appendChild(card);
      });
    }, function () {
      list.innerHTML = '<div class="lx-pending" style="grid-column:1/-1"><b>Could not load</b><p>Check your connection and try again.</p></div>';
    });
  }

  window.OPLO_ASSIGNMENTS = { draw: drawAssignments };
})();
