/* ==========================================================================
   My Classes — the student's enrolled classes.

   Shows every Class the student is enrolled in, with progress, next
   assignment, and a direct path into each Class Home. This is the
   home screen's replacement for the old "Assigned to you" card grid:
   a class is not a course, and a student belongs to classes, not courses.
   ========================================================================== */
(function () {
  "use strict";

  var API = window.OPLO_API;
  var S = window.OPLO ? window.OPLO.S : null;
  var L = window.OPLO_LEARN;

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

  function openClass(cls) {
    if (!window.OPLO_APP) return;
    window.OPLO_APP.enter("class:" + cls.id, cls.t, function () { openClass(cls); });
    window.OPLO_APP.showClassHome(cls);
  }

  function drawClasses() {
    var v = document.getElementById("v-classes");
    if (!v) return;
    v.innerHTML = "";

    var h = new Date().getHours();
    var g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

    var head = el("div", "lx-hello");
    head.textContent = g + ", " + (S && S.me ? S.me.first : "");
    v.appendChild(head);

    var h1 = el("h1", "lx-h1", "Your classes.");
    v.appendChild(h1);

    API.classes.mine().then(function (rows) {
      if (!rows.length) {
        v.appendChild(el("p", "lx-lede", "You are not enrolled in any classes yet. Explore to find one."));
        return;
      }

      v.appendChild(el("h2", "lx-h2", "Enrolled"));
      var grid = el("div", "lx-grid");
      rows.forEach(function (c) {
        var card = el("button", "lx-card");
        card.type = "button";
        var ic = el("span", "ic");
        ic.style.background = (c.hue || "#0071e3") + "1a";
        ic.style.color = c.hue || "#0071e3";
        ic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h18M3 7l4-4h10l4 4M5 7v13h14V7"/><path d="M9 11h6"/></svg>';
        card.appendChild(ic);

        var body = el("div");
        var title = el("b", null, esc(c.title));
        var sub = el("span", null, esc(c.subject || "") + " · " + esc(c.level || "") + " · " + (c.enrolled || 0) + " students");
        body.appendChild(title);
        body.appendChild(sub);
        card.appendChild(body);

        var prog = el("div", "foot");
        var tag = el("span", "lx-tag", c.status || "active");
        prog.appendChild(tag);
        if (c.progress != null) {
          var pct = el("span", null, c.progress + "%");
          pct.style.marginLeft = "auto";
          pct.style.fontSize = "13px";
          pct.style.fontWeight = "600";
          pct.style.color = c.progress >= 80 ? "#12915a" : c.progress >= 40 ? "#b26a00" : "#6e6e73";
          prog.appendChild(pct);
        }
        card.appendChild(prog);

        card.addEventListener("click", function () { openClass(c); });
        grid.appendChild(card);
      });
      v.appendChild(grid);

      /* Next assignment across all classes */
      return API.assignments.upcoming().then(function (work) {
        if (!work || !work.length) return;
        v.appendChild(el("h2", "lx-h2", "Next assignment"));
        var next = work[0];
        var nxt = el("div", "lx-next");
        nxt.innerHTML = '<p class="k">Due soon</p>' +
          '<h2>' + esc(next.title) + '</h2>' +
          '<p class="why">' + esc(next.classTitle || "") + ' · due ' + esc(next.dueLabel || "soon") + '</p>';
        var go = el("button", "lx-btn lg", "Go to assignment");
        go.type = "button";
        go.addEventListener("click", function () {
          if (window.OPLO_APP) window.OPLO_APP.showAssignments();
        });
        nxt.appendChild(go);
        v.appendChild(nxt);
      }, function () {});
    }, function () {
      v.appendChild(el("p", "lx-lede", "Could not load your classes. Check your connection."));
    });
  }

  window.OPLO_CLASSES = { draw: drawClasses, open: openClass };
  window.OPLO_CLASSES_READY = true;
})();
