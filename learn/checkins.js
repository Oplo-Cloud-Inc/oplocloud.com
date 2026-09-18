/* ==========================================================================
   OEdu — Learning Companion.

   The right side of the reading page is a persistent secondary learning
   column that changes its content based on where the student is reading.

   At important points the companion holds a small interactive activity
   anchored to the exact content the student is reading.

   Types:
   - key-idea: a one-line truth (secondary)
   - quick-check: recall or recognize (primary)
   - watch-out: common misconception (secondary)
   - connect: how this links to what comes next (tertiary)
   - think: open-ended reflection (tertiary)
   - apply: use the concept in a new situation (primary)

   Design principles:
   - Persistent: column exists throughout the lesson
   - Contextual: every card relates to nearby content
   - Optional: students can engage without being forced
   - Lightweight: never competes with the reading
   - Hierarchical: Quick Check > Key Idea > Connection
   - Continuous: completed interactions remain as artifacts
   - Calm: no popups, no aggressive animations
   ========================================================================== */
window.OPLO_CHECKINS = (function () {
  "use strict";

  var MAX_VISIBLE = 3;
  var ON = true;

  /* --------------------------------------------------------- Storage */
  function getMemory() {
    try { return JSON.parse(localStorage.getItem("oplo_checkins") || "{}"); }
    catch (e) { return {}; }
  }
  function saveMemory(m) {
    try { localStorage.setItem("oplo_checkins", JSON.stringify(m)); } catch (e) {}
  }

  function getInteractions() {
    var m = getMemory();
    if (!m.interactions) m.interactions = {};
    return m.interactions;
  }

  function markDone(id) {
    var m = getMemory();
    if (!m.interactions) m.interactions = {};
    if (!m.interactions[id]) {
      m.interactions[id] = { done: true, at: Date.now() };
      saveMemory(m);
    }
  }

  function isDone(id) {
    var i = getInteractions()[id];
    return i && i.done;
  }

  /* ------------------------------------------------------------- Utils */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  /* ---------------------------------------------------- Render body */
  function renderBody(comp) {
    if (comp.type === "quick-check") {
      return renderQuickCheck(comp);
    }
    if (comp.type === "key-idea") {
      return '<div class="qc-kicker key">' + esc(comp.label || "Key Idea") + "</div>" +
             '<p class="qc-text">' + esc(comp.content) + "</p>";
    }
    if (comp.type === "apply") {
      return '<div class="qc-kicker apply">' + esc(comp.label || "Apply It") + "</div>" +
             '<p class="qc-text">' + esc(comp.content) + "</p>" +
             (comp.opts ? renderOptionsStatic(comp.opts) : "");
    }
    if (comp.type === "watch-out") {
      return '<div class="qc-kicker watch">' + esc(comp.label || "Watch Out") + "</div>" +
             '<p class="qc-text">' + esc(comp.content) + "</p>";
    }
    if (comp.type === "connect") {
      return '<div class="qc-kicker connect">' + esc(comp.label || "Connect") + "</div>" +
             '<p class="qc-text">' + esc(comp.content) + "</p>";
    }
    if (comp.type === "think") {
      return '<div class="qc-kicker think">' + esc(comp.label || "Think") + "</div>" +
             '<p class="qc-text">' + esc(comp.content) + "</p>" +
             '<div class="qc-line"></div>';
    }
    if (comp.type === "look") {
      return '<div class="qc-kicker look">' + esc(comp.label || "Look") + "</div>" +
             (comp.img ? '<img class="qc-img" src="' + esc(comp.img) + '" alt="' + esc(comp.alt || "") + '">' : "") +
             '<p class="qc-text">' + esc(comp.content) + "</p>";
    }
    return '<div class="qc-kicker">' + esc(comp.type) + "</div>" +
           '<p class="qc-text">' + esc(comp.content || "") + "</p>";
  }

  function renderQuickCheck(comp) {
    var q = comp.question;
    if (!q) return "";
    var type = q.type || "mc";
    var done = isDone(comp.id);
    if (type === "sa") return renderShortAnswer(comp, done);
    if (type === "tf") return renderTrueFalse(comp, done);
    return renderMultipleChoice(comp, done);
  }

  function renderMultipleChoice(comp, done) {
    var q = comp.question;
    var html = '<div class="qc-q">' + esc(q.q) + "</div>";
    html += '<div class="qc-opts">';
    q.opts.forEach(function (opt, i) {
      var letter = String.fromCharCode(65 + i);
      html += '<button type="button" class="qc-opt' + (done ? " sel" : "") + '"' +
              (done ? ' disabled="disabled"' : "") + ">" +
              "<span class=" + esc(letter) + ">" + esc(letter) + "</span>" +
              "<span>" + esc(opt) + "</span>" +
              "</button>";
    });
    html += "</div>";
    if (!done) {
      html += '<button type="button" class="qc-go">Check</button>';
    }
    html += '<button type="button" class="qc-skip">Skip</button>';
    return html;
  }

  function renderTrueFalse(comp, done) {
    var q = comp.question;
    var html = '<div class="qc-q">' + esc(q.q) + "</div>";
    html += '<div class="qc-opts">';
    q.opts.forEach(function (opt, i) {
      html += '<button type="button" class="qc-opt' + (done ? " sel" : "") + '"' +
              (done ? ' disabled="disabled"' : "") + ">" + esc(opt) + "</button>";
    });
    html += "</div>";
    if (!done) {
      html += '<button type="button" class="qc-go">Check</button>';
    }
    html += '<button type="button" class="qc-skip">Skip</button>';
    return html;
  }

  function renderShortAnswer(comp, done) {
    var q = comp.question;
    var html = '<div class="qc-q">' + esc(q.q) + "</div>";
    if (done) {
      html += '<p class="qc-answer-text">' + esc(comp.answer) + "</p>";
    } else {
      html += '<input type="text" class="qc-in" placeholder="Type your answer…" autocomplete="off">';
      html += '<button type="button" class="qc-go">Check</button>';
    }
    html += '<button type="button" class="qc-skip">Skip</button>';
    return html;
  }

  function renderOptionsStatic(opts) {
    var html = '<div class="qc-opts static">';
    opts.forEach(function (o) {
      html += '<div class="qc-opt-static">' + esc(o) + "</div>";
    });
    html += "</div>";
    return html;
  }

  /* ----------------------------------------------------- Feedback */
  function renderFeedback(comp) {
    var html = '<div class="qc-feedback qc-correct">✓ Got it</div>';
    if (comp.why) {
      html += "<p>" + esc(comp.why) + "</p>";
    }
    return html;
  }

  /* ---------------------------------------------------- Card builder */
  function buildCard(comp) {
    var card = el("div", "qc-card " + comp.type);
    card.dataset.compId = comp.id;

    var done = isDone(comp.id);

    var head = el("div", "qc-head");
    head.appendChild(el("span", "qc-label", comp.label || capitalize(comp.type)));
    if (comp.interactive && !done) {
      var skip = el("button", "qc-skip", "Not now");
      skip.type = "button";
      skip.addEventListener("click", function () {
        markDone(comp.id);
        card.classList.add("qc-skipped");
        setTimeout(function () { if (card.parentNode) card.parentNode.removeChild(card); }, 400);
      });
      head.appendChild(skip);
    }
    card.appendChild(head);

    var body = el("div", "qc-body");
    body.innerHTML = renderBody(comp);
    card.appendChild(body);

    if (done && comp.why) {
      var fb = el("div", "qc-feedback qc-correct");
      fb.innerHTML = "<b>✓ Checked</b><p>" + esc(comp.why) + "</p>";
      card.appendChild(fb);
    }

    if (comp.interactive && !done) {
      wireInteraction(card, comp);
    }

    return card;
  }

  function wireInteraction(card, comp) {
    if (comp.type !== "quick-check") return;
    var q = comp.question;
    if (!q) return;

    function gradeAndShow(answer) {
      if (!answer) return;
      var correct = false;
      if (q.type === "sa") {
        var accepted = comp.accept || [];
        correct = accepted.indexOf(String(answer).toLowerCase()) > -1;
      } else {
        var idx = parseInt(answer, 10);
        correct = idx === q.right;
      }
      markDone(comp.id);
      var body = card.querySelector(".qc-body");
      body.innerHTML = renderBody(comp);
      if (!correct) {
        body.innerHTML += renderFeedback(comp);
      }
    }

    card.addEventListener("click", function (e) {
      var opt = e.target.closest(".qc-opt");
      if (opt && !opt.disabled) {
        card.querySelectorAll(".qc-opt").forEach(function (o) { o.classList.add("sel"); o.disabled = true; });
        var go = card.querySelector(".qc-go");
        if (go) go.addEventListener("click", function () { gradeAndShow(opt.dataset.idx); });
      }
      if (e.target.classList.contains("qc-go")) {
        var sel = card.querySelector(".qc-opt.sel");
        if (sel) gradeAndShow(sel.dataset.idx);
        var inp = card.querySelector(".qc-in");
        if (inp) gradeAndShow(inp.value);
      }
    });

    var inp = card.querySelector(".qc-in");
    if (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") gradeAndShow(inp.value);
      });
    }
  }

  /* --------------------------------------------- Rank and render ----- */
  function rankCompanions(sections) {
    var all = [];
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s.checkins) {
        for (var j = 0; j < s.checkins.length; j++) {
          var c = s.checkins[j];
          c._sectionN = s.n;
          all.push(c);
        }
      }
    }
    if (!all.length) return [];

    var uniq = {};
    var ranked = [];
    all.forEach(function (c) {
      var key = c.type + ":" + c.anchor;
      if (uniq[key]) return;
      uniq[key] = true;

      var importance = 1;
      if (c.importance === "primary") importance = 3;
      else if (c.importance === "secondary") importance = 2;

      var state = 0;
      if (isDone(c.id)) state = 2;
      else if (c.interactive) state = 1;

      ranked.push({ comp: c, score: importance * 10 + state });
    });

    ranked.sort(function (a, b) { return b.score - a.score; });
    return ranked.slice(0, MAX_VISIBLE).map(function (r) { return r.comp; });
  }

  function render() {
    if (!companionEl) return;

    var sections = window.OPLO_CURRENT_SECTIONS || [];
    var readIx = window.OPLO_CURRENT_READ_IX;
    if (!sections.length || readIx === null || readIx === undefined) {
      companionEl.innerHTML = '<div class="qc-empty">Learning Companion</div>';
      return;
    }

    var ranked = rankCompanions(sections);
    companionEl.innerHTML = "";

    var head = el("div", "qc-col-head");
    head.innerHTML = '<span class="qc-col-title">Learning Companion</span>' +
      '<span class="qc-col-sub">Near what you are reading</span>';
    companionEl.appendChild(head);

    if (ranked.length === 0) {
      companionEl.appendChild(el("p", "qc-empty", "Keep reading — learning moments appear as you go."));
      return;
    }

    ranked.forEach(function (comp) {
      var card = buildCard(comp);
      companionEl.appendChild(card);
    });
  }

  /* ------------------------------------------ section change detection */
  function watchState() {
    var lastIx = null;
    setInterval(function () {
      var ix = window.OPLO_CURRENT_READ_IX;
      var sec = window.OPLO_CURRENT_SECTIONS;
      if (sec && sec.length && ix !== null && ix !== lastIx) {
        lastIx = ix;
        render();
      }
    }, 500);
  }

  function watchScroll() {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { ticking = false; render(); });
      }
    }, { passive: true });
  }

  /* -------------------------------------------------------- student UI */
  function createToggle() {
    if (!companionEl) return;
    var bar = el("div", "qc-col-bar");
    var btn = el("button", "qc-col-toggle", "Learning Companion · On");
    btn.type = "button";
    btn.addEventListener("click", function () { showCompanionToggle(); });
    bar.appendChild(btn);
    companionEl.insertBefore(bar, companionEl.firstChild);
  }

  function showCompanionToggle() {
    var existing = document.getElementById("qc-col-menu");
    if (existing) { existing.parentNode.removeChild(existing); return; }

    var menu = el("div", "qc-col-menu");
    menu.innerHTML =
      '<div class="qc-col-title">Learning Companion</div>' +
      '<div class="qc-col-opt' + (ON ? " sel" : "") + '" data-mode="on">On</div>' +
      '<div class="qc-col-opt' + (!ON ? " sel" : "") + '" data-mode="off">Off</div>' +
      '<p class="qc-col-desc">Small activities that help you think about ' +
      "what you're reading. They sit beside the lesson and don't " +
      "interrupt it. You can ignore them.</p>" +
      '<button type="button" class="qc-col-done">Done</button>';

    var btn = document.querySelector(".qc-col-toggle");
    if (btn && btn.parentNode) {
      btn.parentNode.insertBefore(menu, btn.nextSibling);
    }

    menu.querySelectorAll(".qc-col-opt").forEach(function (opt) {
      opt.addEventListener("click", function () {
        ON = opt.dataset.mode === "on";
        var btn2 = document.querySelector(".qc-col-toggle");
        if (btn2) btn2.textContent = "Learning Companion · " + (ON ? "On" : "Off");
        menu.style.display = "none";
        if (!ON) {
          companionEl.innerHTML = "";
        } else {
          render();
        }
      });
    });

    var done = menu.querySelector(".qc-col-done");
    if (done) {
      done.addEventListener("click", function () { menu.style.display = "none"; });
    }
  }

  /* ------------------------------------------------------ initialization */
  function init() {
    var readView = document.getElementById("v-read");
    if (!readView) return;

    var aside = readView.querySelector("aside.rd-margin");
    if (!aside) return;

    companionEl = el("div", "qc-col");
    var wrap = aside.querySelector(".mg-wrap");
    if (wrap) {
      wrap.innerHTML = "";
      wrap.appendChild(companionEl);
    } else {
      aside.appendChild(companionEl);
    }

    createToggle();
    render();
    watchState();
    watchScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 200);
  }

  return {
    init: init,
    render: render,
    isDone: isDone,
    markDone: markDone,
    setOn: function (v) { ON = v; render(); },
    getInteractions: getInteractions
  };
})();
