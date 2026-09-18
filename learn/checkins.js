/* ==========================================================================
   OEdu — Quick Checks (Learning Checks).

   Small, optional retrieval practice moments embedded directly into
   reading. Not quizzes. Not interrupts. Tiny learning cards that sit
   in the reading margin.

   Read → Understand concept → Quick Check → Recall it → Feedback → Continue

   Design principles:
   - Optional: every card has Skip. No penalty, no grade, no lock.
   - Infrequent: 2-4 per 10 minutes of reading (Light mode), default 3.
   - Varied: sometimes recognition, sometimes recall, sometimes application.
   - Remembered: OEdu quietly notes which concepts a student skipped or
     struggled with, and surfaces them later for reinforcement.
   - Belongs to the page: the card appears in the right margin and feels
     like part of the reading, not a popup.
   ========================================================================== */
window.OPLO_CHECKINS = (function () {
  "use strict";

  /* ---------------------------------------------------------- Settings */
  var FREQUENCY = "light"; // "light" (1-2 per session) | "standard" (2-4) | "frequent" (4-6)
  var ON = true;           // student toggle: on / fewer / off

  var FREQUENCY_COUNT = { light: 2, standard: 3, frequent: 4 };
  var FREQUENCY_INTERVAL = 300000; // 5 minutes between checks (minimum)

  /* --------------------------------------------------------- Storage */
  function getMemory() {
    try { return JSON.parse(localStorage.getItem("oplo_checkins") || "{}"); }
    catch (e) { return {}; }
  }
  function saveMemory(m) {
    try { localStorage.setItem("oplo_checkins", JSON.stringify(m)); } catch (e) {}
  }

  function readMemory() {
    var m = getMemory();
    var today = new Date().toISOString().slice(0, 10);
    if (m[today] === undefined) m[today] = { count: 0, firstCheck: null, skipped: [] };
    return m;
  }
  function writeMemory(m) { saveMemory(m); }

  /* ------------------------------------------------------- State */
  var active = null;        // the currently showing check-in card
  var shown = 0;            // how many shown in current reading session
  var lastShownAt = 0;      // timestamp of last check shown
  var session = "current";  // session identifier (changes per page load)
  var memory = readMemory();
  var container = null;     // DOM element holding the active card

  /* --------------------------------------------------- Helpers */
  function todayKey() { return new Date().toISOString().slice(0, 10); }

  function canShow() {
    if (!ON) return false;
    if (shown >= FREQUENCY_COUNT[FREQUENCY]) return false;
    var now = Date.now();
    if (lastShownAt && now - lastShownAt < FREQUENCY_INTERVAL) return false;
    var m = readMemory();
    if (m[todayKey()] && m[todayKey()].count >= FREQUENCY_COUNT[FREQUENCY] * 3) return false;
    return true;
  }

  function recordShown(checkId, concept) {
    shown++;
    lastShownAt = Date.now();
    var m = readMemory();
    m[todayKey()].count++;
    if (!m.shown) m.shown = [];
    m.shown.push({ id: checkId, concept: concept, at: Date.now(), session: session });
    writeMemory(m);
  }

  function recordResult(checkId, concept, result, answer) {
    var m = readMemory();
    if (!m.results) m.results = [];
    m.results.push({
      id: checkId, concept: concept, result: result,
      answer: answer, at: Date.now(), session: session
    });
    writeMemory(m);
  }

  function recordSkipped(checkId, concept) {
    var m = readMemory();
    if (!m.skipped) m.skipped = [];
    m.skipped.push({ id: checkId, concept: concept, at: Date.now(), session: session });
    writeMemory(m);
  }

  /* ---------------------------------------------------- Question types */
  function renderMC(q, state) {
    var html = '<div class="qc-question">' + esc(q.q) + "</div>";
    html += '<div class="qc-options">';
    q.opts.forEach(function (opt, i) {
      var letter = String.fromCharCode(65 + i); // A, B, C...
      html += '<button type="button" class="qc-option" data-idx="' + i + '">' +
              '<span class="qc-letter">' + letter + "</span>" +
              "<span>" + esc(opt) + "</span>" +
              "</button>";
    });
    html += "</div>";
    html += '<button type="button" class="qc-submit">Check answer</button>';
    html += '<button type="button" class="qc-skip">Skip</button>';
    return html;
  }

  function renderTF(q, state) {
    var html = '<div class="qc-question">' + esc(q.q) + "</div>";
    html += '<div class="qc-options">';
    q.opts.forEach(function (opt, i) {
      html += '<button type="button" class="qc-option" data-idx="' + i + '">' +
              "<span>" + esc(opt) + "</span>" +
              "</button>";
    });
    html += "</div>";
    html += '<button type="button" class="qc-submit">Check answer</button>';
    html += '<button type="button" class="qc-skip">Skip</button>';
    return html;
  }

  function renderSA(q, state) {
    var html = '<div class="qc-question">' + esc(q.q) + "</div>";
    html += '<input type="text" class="qc-answer" placeholder="Type your answer…" autocomplete="off">';
    html += '<button type="button" class="qc-submit">Check answer</button>';
    html += '<button type="button" class="qc-skip">Skip</button>';
    return html;
  }

  function renderQuestion(q, state) {
    var type = q.type || "mc";
    if (type === "tf") return renderTF(q, state);
    if (type === "sa") return renderSA(q, state);
    return renderMC(q, state);
  }

  /* ---------------------------------------------------- Render result */
  function renderResult(q, state, result, answer) {
    var ok = result === "correct";
    var html = "";
    if (ok) {
      html += '<div class="qc-feedback qc-correct">✓ Got it</div>';
      html += "<p>" + esc(q.why || "That's right.") + "</p>";
    } else {
      html += '<div class="qc-feedback qc-wrong">Not quite</div>';
      html += "<p>" + esc(q.why || "Let's look at this again.") + "</p>";
      if (answer !== null && answer !== undefined && q.opts) {
        var chosen = q.opts[answer];
        if (chosen) {
          html += "<p><em>You said:</em> " + esc(String(chosen)) + "</p>";
        }
      }
    }
    html += '<button type="button" class="qc-continue">Continue reading →</button>';
    return html;
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

  /* ---------------------------------------------------- Card builder */
  function buildCard(section, check) {
    var card = el("div", "qc-card");
    card.dataset.checkId = check.id;
    card.dataset.concept = check.concept || section.t;

    var state = { answered: false, answer: null };

    card.innerHTML =
      '<div class="qc-head">' +
        '<span class="qc-label">Quick Check</span>' +
        '<button type="button" class="qc-dismiss" title="Not now">✕</button>' +
      "</div>" +
      '<div class="qc-body">' + renderQuestion(check, state) + "</div>";

    card.querySelector(".qc-dismiss").addEventListener("click", function () {
      dismiss(card, check);
    });

    function dismiss(c, ch) {
      recordSkipped(ch.id, ch.concept || section.t);
      c.classList.add("qc-dismissing");
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 300);
      active = null;
    }

    function submit() {
      var idx = null;
      var selected = card.querySelectorAll(".qc-option.selected");
      if (selected.length > 0) idx = parseInt(selected[0].dataset.idx, 10);
      var saInput = card.querySelector(".qc-answer");
      var saAnswer = saInput ? saInput.value.trim() : null;

      var answer = (q.type === "sa") ? saAnswer : idx;
      var correct = grade(check, answer);
      var result = correct ? "correct" : "incorrect";

      state.answered = true;
      state.answer = answer;
      recordResult(check.id, check.concept || section.t, result, answer);

      card.querySelector(".qc-body").innerHTML = renderResult(check, state, result, answer);

      card.querySelector(".qc-continue").addEventListener("click", function () {
        if (card.parentNode) card.parentNode.removeChild(card);
        active = null;
      });
    }

    card.addEventListener("click", function (e) {
      if (state.answered) return;
      var opt = e.target.closest(".qc-option");
      if (opt) {
        card.querySelectorAll(".qc-option").forEach(function (o) { o.classList.remove("selected"); });
        opt.classList.add("selected");
      }
      var submitBtn = card.querySelector(".qc-submit");
      if (submitBtn && e.target === submitBtn) submit();
    });

    var saInput = card.querySelector(".qc-answer");
    if (saInput) {
      saInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") submit();
      });
    }
    var submitBtn = card.querySelector(".qc-submit");
    if (submitBtn) {
      submitBtn.addEventListener("click", submit);
    }

    return card;
  }

  function grade(q, answer) {
    if (q.type === "sa") {
      if (!answer) return false;
      var accepted = (q.accept || []).map(function (a) { return a.toLowerCase(); });
      return accepted.indexOf(answer.toLowerCase()) > -1;
    }
    if (q.type === "tf") {
      return answer === q.right;
    }
    return answer === q.right;
  }

  /* -------------------------------------------------- Section checkins */
  function getCheckins(section) {
    return (section.checkins && section.checkins.length) ? section.checkins : [];
  }

  function chooseCheck(section) {
    var checks = getCheckins(section);
    if (!checks.length) return null;

    var m = readMemory();
    var sessionResults = (m.results || []).filter(function (r) { return r.session === session; });
    var alreadyAnswered = {};
    sessionResults.forEach(function (r) { alreadyAnswered[r.id] = true; });

    var available = checks.filter(function (c) { return !alreadyAnswered[c.id]; });
    if (available.length === 0) return null;

    return available[Math.floor(Math.random() * available.length)];
  }

  /* ---------------------------------------------------- Main logic */
  function tryShow() {
    if (!ON) return;
    if (!canShow()) return;
    if (active) return;

    var sections = window.OPLO_CURRENT_SECTIONS || [];
    if (!sections.length) return;

    var readIx = (window.OPLO_CURRENT_READ_IX !== undefined) ? window.OPLO_CURRENT_READ_IX : 0;
    var section = sections[readIx];
    if (!section) return;

    var check = chooseCheck(section);
    if (!check) return;

    var card = buildCard(section, check);
    recordShown(check.id, check.concept || section.t);

    card.classList.add("qc-enter");
    active = card;
    return card;
  }

  /* ----------------------------------------------------- Placement */
  function injectIntoReader() {
    var readView = document.getElementById("v-read");
    if (!readView) return;

    var aside = readView.querySelector("aside.rd-margin");
    if (!aside) return;

    var wrap = aside.querySelector(".mg-wrap");
    if (!wrap) {
      wrap = el("div", "mg-wrap");
      aside.appendChild(wrap);
    }

    var toggleBar = el("div", "qc-toggle-bar");
    toggleBar.innerHTML = '<button type="button" class="qc-toggle" id="qc-toggle-btn">' +
      '<span id="qc-toggle-text">Learning checks · On</span>' +
      "</button>";
    aside.appendChild(toggleBar);

    document.getElementById("qc-toggle-btn").addEventListener("click", function () {
      showToggle();
    });

    window.QC_APPENDIX = wrap;
  }

  function showToggle() {
    var existing = document.getElementById("qc-toggle-menu");
    if (existing) { existing.parentNode.removeChild(existing); return; }

    var menu = el("div", "qc-toggle-menu");
    menu.id = "qc-toggle-menu";
    menu.innerHTML =
      '<div class="qc-toggle-head">Learning checks</div>' +
      '<div class="qc-toggle-options">' +
        '<button type="button" class="qc-toggle-option ' + (ON ? "sel" : "") + '" data-mode="on">On</button>' +
        '<button type="button" class="qc-toggle-option ' + (FREQUENCY === "light" && ON ? "sel" : "") + '" data-mode="fewer">Fewer</button>' +
        '<button type="button" class="qc-toggle-option ' + (!ON ? "sel" : "") + '" data-mode="off">Off</button>' +
      "</div>" +
      '<p class="qc-toggle-desc">These quick questions help you remember what you\'re learning. ' +
      'They are optional — skipping has no effect on your grade.</p>' +
      '<button type="button" class="qc-toggle-done">Done</button>';

    var btn = document.getElementById("qc-toggle-btn");
    btn.parentNode.insertBefore(menu, btn.nextSibling);

    menu.querySelectorAll(".qc-toggle-option").forEach(function (opt) {
      opt.addEventListener("click", function () {
        var mode = opt.dataset.mode;
        if (mode === "on") { ON = true; FREQUENCY = "standard"; }
        if (mode === "fewer") { ON = true; FREQUENCY = "light"; }
        if (mode === "off") { ON = false; }
        document.getElementById("qc-toggle-text").textContent =
          "Learning checks · " + (ON ? (FREQUENCY === "light" ? "Fewer" : "On") : "Off");
        document.getElementById("qc-toggle-menu").style.display = "none";
        if (!ON) {
          document.querySelectorAll(".qc-card").forEach(function (c) {
            if (c.parentNode) c.parentNode.removeChild(c);
          });
          active = null;
        }
      });
    });

    menu.querySelector(".qc-toggle-done").addEventListener("click", function () {
      menu.style.display = "none";
    });
  }

  /* ------------------------------------------------------ Scroll hook */
  function watchScroll() {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (!active && canShow()) {
          var readView = document.getElementById("v-read");
          if (readView) {
            var rect = readView.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              var card = tryShow();
              if (card && window.QC_APPENDIX) {
                window.QC_APPENDIX.appendChild(card);
              }
            }
          }
        }
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------ Init */
  function init() {
    injectIntoReader();
    watchScroll();

    setTimeout(function () {
      if (!active && canShow()) {
        var card = tryShow();
        if (card && window.QC_APPENDIX) {
          window.QC_APPENDIX.appendChild(card);
        }
      }
    }, 8000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    init: init,
    tryShow: tryShow,
    canShow: canShow,
    setOn: function (v) { ON = v; },
    setFrequency: function (f) { FREQUENCY = f; },
    getMemory: getMemory,
    recordShown: recordShown,
    recordResult: recordResult,
    recordSkipped: recordSkipped
  };
})();
