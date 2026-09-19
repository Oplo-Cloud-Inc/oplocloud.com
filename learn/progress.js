/* ==========================================================================
   Progress — mastery, streak, badges, and the week at a glance.

   This is the student's learning analytics: where they are, how long
   they have been there, and what they have earned. No charts that
   the record cannot support; every number comes from the standing
   endpoint or the local record.
   ========================================================================== */
(function () {
  "use strict";

  var API = window.OPLO_API;
  var S = window.OPLO ? window.OPLO.S : null;
  var R = null;
  var game = null;

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

  function setRecord(rec) { R = rec; }

  function draw() {
    var v = document.getElementById("v-progress");
    if (!v) return;
    v.innerHTML = "";
    v.appendChild(el("p", "lx-hello", S && S.me ? "Your learning, measured honestly." : ""));
    v.appendChild(el("h1", "lx-h1", "Progress"));

    if (!R) {
      v.appendChild(el("p", "lx-lede", "Sign in to see your progress."));
      return;
    }

    /* Standing card */
    var standing = el("div", "lx-next");
    var g = R.d.game;
    game = window.OPLO_GAME || {};
    var rankName = game.rank ? game.rank(g.xp).name : "Student";
    standing.innerHTML = '<p class="k">Standing</p>' +
      '<h2>' + esc(rankName) + '</h2>' +
      '<p class="why">' + g.xp.toLocaleString() + " XP · streak " + g.streak + " days</p>";
    v.appendChild(standing);

    /* Mastery overview by subject */
    v.appendChild(el("h2", "lx-h2", "Mastery by subject"));
    var bars = el("div", "lx-bars");
    window.OPLO_SCHOOL.subjects().forEach(function (sub) {
      var pct = window.OPLO_APP && window.OPLO_APP.subjectPct ? window.OPLO_APP.subjectPct(sub.n) : null;
      if (pct == null) return;
      var row = el("div", "lx-barrow");
      row.innerHTML = "<b>" + esc(sub.n) + '</b><span class="track"><i style="width:' +
        pct + '%"></i></span><span class="pc">' + pct + "%</span>";
      bars.appendChild(row);
    });
    if (bars.children.length) v.appendChild(bars);

    /* Badges */
    v.appendChild(el("h2", "lx-h2", "Badges"));
    var badgeGrid = el("div", "lx-grid");
    var badges = game.BADGES || [];
    badges.forEach(function (b) {
      var has = !!g.badges[b.k];
      var icon = has
        ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="var(--amber)" stroke="var(--amber)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.9l6.1-.8z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--ink-3)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5 9 17.5 20 6.5"/></svg>';
      var card = el("div", "lx-card");
      card.style.minHeight = "auto";
      card.innerHTML = '<h3>' + icon + ' ' + esc(b.name) + '</h3>' +
        '<p>' + esc(b.say) + '</p>' +
        '<div class="foot"><span>' + (has ? "Earned" : "Locked") + '</span></div>';
      badgeGrid.appendChild(card);
    });
    if (badgeGrid.children.length) v.appendChild(badgeGrid);

    /* Week chart */
    v.appendChild(el("h2", "lx-h2", "This week"));
    var wk = game.week ? game.week(R, window.OPLO_STORE) : [];
    if (wk.length) {
      var chart = el("div", "lx-bars");
      var top = Math.max(g.goal, wk.reduce(function (a, d) { return Math.max(a, d.xp); }, 0));
      wk.forEach(function (d) {
        var row = el("div", "lx-barrow");
        row.innerHTML = "<b>" + esc(d.label) + '</b><span class="track"><i style="width:' +
          Math.round(d.xp / top * 100) + '%"></i></span><span class="pc">' + d.xp + " XP</span>";
        chart.appendChild(row);
      });
      v.appendChild(chart);
    }

    /* Goal */
    v.appendChild(el("h2", "lx-h2", "Today's goal"));
    var goal = el("div", "lx-bal");
    goal.innerHTML = '<span class="amt">' + g.today + " / " + g.goal + '</span>' +
      '<span class="k">' + (g.today >= g.goal ? "Goal met" : (g.goal - g.today) + " XP to go") + '</span>';
    v.appendChild(goal);
  }

  window.OPLO_PROGRESS = { draw: draw, setRecord: setRecord };
})();
