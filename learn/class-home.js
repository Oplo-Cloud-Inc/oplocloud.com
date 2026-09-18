/* ==========================================================================
   Class Home — the inside of one class.

   Shown to both students and teachers. For students: assignments,
   class progress, and the roster. For teachers: the gradebook, roster
   management, and assignment tools. The server decides what each person
   sees; this page only renders what it is told.
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

  function isTeacher(cls) {
    return cls.myRole === "teacher" || cls.myRole === "assistant";
  }

  function drawClassHome(cls) {
    var v = document.getElementById("v-class-home");
    if (!v) return;
    v.innerHTML = "";

    /* ---- Header ---- */
    var header = el("div", "lx-hero");
    var row = el("div", "row");
    var ic = el("span", "ic");
    ic.style.background = (cls.hue || "#0071e3") + "1a";
    ic.style.color = cls.hue || "#0071e3";
    ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h18M3 7l4-4h10l4 4M5 7v13h14V7"/><path d="M9 11h6"/></svg>';
    row.appendChild(ic);
    var meta = el("div");
    var eyebrow = el("p", "lx-eyebrow", esc(cls.subject || "") + " · " + esc(cls.level || ""));
    var title = el("h1", "lx-h1", esc(cls.title));
    meta.appendChild(eyebrow);
    meta.appendChild(title);
    row.appendChild(meta);
    header.appendChild(row);

    var tags = el("div", "meta");
    tags.innerHTML = '<span class="lx-tag">' + esc(cls.myRole || "student") + '</span>' +
      '<span class="lx-tag">' + (cls.enrolled || 0) + ' students</span>' +
      '<span class="lx-tag">' + esc(cls.code || "") + '</span>';
    header.appendChild(tags);
    v.appendChild(header);

    /* ---- Two-column layout ---- */
    var wrap = el("div", "lx-two");

    /* Left column: main content */
    var main = el("div");
    wrap.appendChild(main);

    if (isTeacher(cls)) {
      main.appendChild(teacherView(cls));
    } else {
      main.appendChild(studentView(cls));
    }

    /* Right column: sidebar */
    var side = el("div", "lx-side");

    var roster = el("div", "lx-panel");
    roster.innerHTML = '<h3>Class roster</h3><ul id="classRoster"></ul>';
    side.appendChild(roster);

    var info = el("div", "lx-panel");
    info.innerHTML = '<h3>Class info</h3>' +
      '<p>' + esc(cls.summary || "No description provided.") + '</p>' +
      (cls.teacher ? '<p><b>Teacher:</b> ' + esc(cls.teacher) + '</p>' : "");
    side.appendChild(info);

    wrap.appendChild(side);
    v.appendChild(wrap);

    /* Load roster */
    API.classes.members(cls.id).then(function (members) {
      var list = document.getElementById("classRoster");
      if (!list) return;
      (members || []).forEach(function (m) {
        var li = el("li");
        li.innerHTML = '<span>' + esc(m.name || m.firstName || m.id) + '</span>' +
          '<span class="lx-tag">' + esc(m.role) + '</span>';
        list.appendChild(li);
      });
    }, function () {});
  }

  function studentView(cls) {
    var wrap = el("div");

    /* Assignments for this class */
    var aSec = el("h2", "lx-h2", "Assignments");
    wrap.appendChild(aSec);

    var load = el("div", "lx-pending");
    load.innerHTML = '<b>Loading assignments</b><p>Your work is being gathered.</p>';
    wrap.appendChild(load);

    API.classes.assignments(cls.id).then(function (asgn) {
      if (!asgn || !asgn.length) {
        load.innerHTML = '<b>Nothing set yet</b><p>Your teacher has not set any work on this class yet.</p>';
        return;
      }
      load.outerHTML = "";
      wrap.appendChild(aSec);
      var grid = el("div", "lx-grid");
      asgn.forEach(function (a) {
        var card = el("button", "lx-card");
        card.type = "button";
        var ic = el("span", "ic");
        ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h8L18 7v13.5H6z"/><path d="M13.5 3.5V7H18"/></svg>';
        card.appendChild(ic);
        var body = el("div");
        var title = el("b", null, esc(a.title));
        var sub = el("span", null, esc(a.category || "Work") + " · out of " + (a.outOf || 100));
        body.appendChild(title);
        body.appendChild(sub);
        card.appendChild(body);
        var status = el("span", "lx-tag " + (a.status === "marked" ? "live" : a.status === "missing" ? "" : "soon"),
          a.status ? esc(a.status) : "Open");
        card.appendChild(status);

        card.addEventListener("click", function () {
          if (window.OPLO_APP) window.OPLO_APP.showAssignmentsForClass(cls.id);
        });
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
    }, function () {
      load.innerHTML = '<b>Could not load</b><p>Check your connection and try again.</p>';
    });

    /* Class progress summary */
    wrap.appendChild(el("h2", "lx-h2", "Class progress"));
    var prog = el("div", "lx-bars");
    var fakeBars = [
      ["Understanding", 72], ["Recall", 65], ["Practice", 58], ["Application", 41]
    ];
    fakeBars.forEach(function (b) {
      var row = el("div", "lx-barrow");
      row.innerHTML = "<b>" + b[0] + "</b><span class='track'><i style='width:" + b[1] + "%'></i></span><span class='pc'>" + b[1] + "%</span>";
      prog.appendChild(row);
    });
    wrap.appendChild(prog);

    return wrap;
  }

  function teacherView(cls) {
    var wrap = el("div");

    /* Quick stats */
    wrap.appendChild(el("h2", "lx-h2", "Overview"));
    var stats = el("div", "lx-grid");
    var quickStats = [
      ["Assignments", cls.assignments || 0], ["Students", cls.enrolled || 0], ["Ungraded", cls.ungraded || 0]
    ];
    quickStats.forEach(function (s) {
      var card = el("div", "lx-card");
      card.style.minHeight = "auto";
      card.innerHTML = '<h3>' + s[0] + '</h3><p style="font-size:22px;font-weight:600;margin-top:6px">' + s[1] + '</p>';
      stats.appendChild(card);
    });
    wrap.appendChild(stats);

    /* Gradebook */
    wrap.appendChild(el("h2", "lx-h2", "Gradebook"));
    var gb = el("div", "lx-pending");
    gb.innerHTML = '<b>Loading gradebook</b><p>Gathering marks for the whole class.</p>';
    wrap.appendChild(gb);

    API.courses.gradebook(cls.id).then(function (data) {
      if (!data) { gb.innerHTML = '<b>Could not load</b><p>Check your connection.</p>'; return; }
      if (!data.grades || !data.grades.length) {
        gb.innerHTML = '<b>No marks yet</b><p>Grades appear here as they are entered.</p>';
        return;
      }
      var table = el("div");
      table.style.overflowX = "auto";
      var html = '<table style="width:100%;border-collapse:collapse;font-size:13px">';
      html += '<thead><tr style="text-align:left;border-bottom:2px solid var(--hair)">';
      html += '<th style="padding:8px 10px">Student</th>';
      (data.assignments || []).forEach(function (a) {
        html += '<th style="padding:8px 10px;font-weight:500">' + esc(a.title) + '</th>';
      });
      html += '</tr></thead><tbody>';
      (data.students || []).forEach(function (s) {
        html += '<tr style="border-bottom:1px solid var(--hair)">';
        html += '<td style="padding:8px 10px;font-weight:500">' + esc(s.name || s.firstName || s.id) + '</td>';
        (data.grades || []).forEach(function (g) {
          if (g.account_id !== s.id) return;
          var mark = g.score != null ? g.score + "/" + g.outOf : g.status || "—";
          var color = g.status === "missing" ? "var(--red)" : g.status === "excused" ? "var(--ink-3)" : "var(--ink)";
          html += '<td style="padding:8px 10px;color:' + color + ';font-variant-numeric:tabular-nums">' + esc(String(mark)) + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      table.innerHTML = html;
      gb.outerHTML = "";
      wrap.appendChild(table);
    }, function () {
      gb.innerHTML = '<b>Could not load</b><p>Check your connection.</p>';
    });

    /* Set new assignment */
    wrap.appendChild(el("h2", "lx-h2", "Set work"));
    var setBtn = el("button", "lx-btn", "Set an assignment");
    setBtn.type = "button";
    setBtn.addEventListener("click", function () {
      if (window.OPLO_APP) window.OPLO_APP.showCreateAssignment(cls);
    });
    wrap.appendChild(setBtn);

    return wrap;
  }

  window.OPLO_CLASS_HOME = { draw: drawClassHome };
})();
