/* ==========================================================================
   The feel of an activity, shared by the courses that learn by doing on Kern.

   A step is a guest; the lesson player is the host. The step knows whether it
   can be checked and whether it is right. The player owns Check, the verdict,
   hints and progress. This file adds what the host owes every guest, once:

     Sound    little sounds made in the browser, no files: a tick, a soft
              landing, a bell that climbs as things are counted, three notes
              for "yes", two gentle falling ones for "look again". One switch,
              remembered. Never a buzzer.
     Clock    one two-second beat that rings, glows and hints all keep to.
              It is told to play, to settle (finish the beat it is in) or to
              pause, so everything lit is in step and nothing is cut off.
     Graph    the controls of a step as named nodes ("answer", "option-2",
              "check") with a sentence each, in the attributes a screen reader
              reads. Anything that points at a step — the glow after a quiet
              moment, one day a tutor — does it through act(), which only takes
              names that are in the graph: a made-up name is turned away.
     Nudge    a child who has gone quiet on an open step is shown what to do
              next: the box to type in, the answers to choose from, Check, or
              Continue. Never which answer is right.

   Grade 1 (lab/k1kit.js) uses the sound and the clock for its pictures.
   Prealgebra gets all of it through the card hook, on Kern only.
   ========================================================================== */
(function () {
  "use strict";
  if (window.OPLO_FEEL) return;
  var CH = window.OPLO_CHALLENGE;

  function reduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }

  /* ================================================================ Sound */
  var SFX = (function () {
    var AC = window.AudioContext || window.webkitAudioContext, ctx = null, master = null, subs = [];
    function readPref() {
      // `oplo.sfx` is the switch; `oplo.k1.sfx` is where Grade 1 first kept it.
      try { return localStorage.getItem("oplo.sfx") !== "off" && localStorage.getItem("oplo.k1.sfx") !== "off"; } catch (e) { return true; }
    }
    var on = readPref();
    function ready() {
      if (!AC) return false;
      if (!ctx) {
        try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); }
        catch (e) { AC = null; return false; }
      }
      if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) { /* no gesture yet */ } }
      return true;
    }
    // One soft note: a quick attack and a long fall; `to` glides the pitch.
    function note(f, at, dur, vol, type, to) {
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + 0.004 + at;
      o.type = type || "sine";
      o.frequency.setValueAtTime(f, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.03);
    }
    function bell(f, at, dur, vol) { note(f, at, dur, vol, "sine"); note(f * 2, at, dur * 0.6, vol * 0.25, "sine"); }
    var C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;
    var LADDER = [C5, 587.33, E5, G5, 880, C6, 1174.66, 1318.51, 1567.98];       // a pentatonic climb: each number is higher
    var SOUNDS = {
      pick: function () { note(784, 0, 0.07, 0.05, "sine"); },
      drop: function () { note(300, 0, 0.1, 0.09, "triangle", 170); },
      tap: function () { note(587.33, 0, 0.06, 0.06, "sine"); },
      count: function (n) { bell(LADDER[Math.max(0, Math.min(LADDER.length - 1, (n || 1) - 1))], 0, 0.22, 0.08); },
      yes: function () { bell(C5, 0, 0.24, 0.07); bell(E5, 0.075, 0.24, 0.07); bell(G5, 0.15, 0.4, 0.07); },
      no: function () { note(392, 0, 0.18, 0.06, "triangle"); note(329.63, 0.14, 0.26, 0.05, "triangle"); },
      shown: function () { bell(E5, 0, 0.34, 0.06); },
      hint: function () { note(880, 0, 0.05, 0.04, "sine"); note(880, 0.1, 0.05, 0.04, "sine"); },
      done: function () { bell(C5, 0, 0.26, 0.07); bell(E5, 0.1, 0.26, 0.07); bell(G5, 0.2, 0.26, 0.07); bell(C6, 0.3, 0.6, 0.07); }
    };
    function play(name, arg) {
      if (!on || !SOUNDS[name]) return false;
      // A test can see what was meant to sound, even where there is no sound card.
      if (window.__OPLO_TEST) (window.__sfxLog = window.__sfxLog || []).push(arg != null ? name + ":" + arg : name);
      if (!ready()) return false;
      try { SOUNDS[name](arg); return true; } catch (e) { return false; }
    }
    return {
      can: !!AC, play: play,
      isOn: function () { return on; },
      set: function (v) {
        on = !!v;
        try { localStorage.removeItem("oplo.k1.sfx"); if (on) localStorage.removeItem("oplo.sfx"); else localStorage.setItem("oplo.sfx", "off"); } catch (e) { /* private window */ }
        subs.forEach(function (f) { f(on); });
      },
      sub: function (f) { subs.push(f); },
      // Browsers start sound only after a touch or a key: wake it on the first one.
      unlock: ready
    };
  })();
  if (SFX.can && window.OPLO_KERN) ["pointerdown", "keydown"].forEach(function (ev) { window.addEventListener(ev, function once() { window.removeEventListener(ev, once, true); SFX.unlock(); }, true); });

  /* ================================================================ Clock
     Elements opt in with data-synced-to-pulse-timer and carry their own CSS
     animation; the clock sets that animation's length to one beat, starts
     every one from the same moment, and rests them at their first frame. */
  var PERIOD = 2000;
  function clock(root, o) {
    o = o || {};
    var st = "paused", t0 = 0, tm = null;
    function now() { var t = document.timeline && document.timeline.currentTime; return typeof t === "number" ? t : performance.now(); }
    function sync() {
      [].forEach.call(root.querySelectorAll("[data-synced-to-pulse-timer]"), function (n) {
        if (!n.getAnimations) return;
        n.getAnimations().forEach(function (a) {
          try { a.effect.updateTiming({ duration: PERIOD, iterations: Infinity }); } catch (e) { /* not a timed animation */ }
          if (st === "paused") { try { a.pause(); a.currentTime = 0; } catch (e) { /* gone */ } }
          else { try { a.play(); a.startTime = t0; } catch (e) { /* gone */ } }
        });
      });
      if (o.cls) root.classList.toggle(o.cls, st !== "paused");
    }
    return {
      state: function () { return st; },
      sync: sync,
      play: function () { clearTimeout(tm); tm = null; if (st === "paused") t0 = now(); st = "playing"; sync(); },
      // Finish the beat it is in, then rest; `done` is called once it has.
      settle: function (done) {
        clearTimeout(tm); tm = null;
        if (st === "paused") { if (done) done(); return; }
        var left = PERIOD - ((now() - t0) % PERIOD);
        st = "settling"; sync();
        tm = setTimeout(function () { tm = null; st = "paused"; sync(); if (done) done(); }, left);
      },
      pause: function () { clearTimeout(tm); tm = null; st = "paused"; sync(); },
      destroy: function () { clearTimeout(tm); tm = null; }
    };
  }

  /* ================================================================ Graph
     Nodes are marked on the page's own elements, with the attribute names a
     screen reader and a tutor both read. */
  var A = { node: "data-scene-graph-node", name: "data-scene-graph-name", desc: "aria-description" };
  function plain(s) { return String(s == null ? "" : s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
  function label(e) { return plain(e.getAttribute("aria-label") || e.textContent || e.value || ""); }
  function slug(s) { return plain(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20); }

  // What a step's controls are called, in page order; each takes the first that matches and is not yet named.
  var SPECS = [
    { sel: ".ch-num", base: "answer", desc: function (e) { var i = e.querySelector("input"); return ((i && i.getAttribute("aria-label")) || "Your answer") + (i && i.value ? ": " + i.value : ". Empty."); } },
    { sel: ".ch-options", base: "options", desc: function () { return "The answers to choose from."; } },
    { sel: ".ch-options .ch-opt", base: "option", desc: function (e) { return label(e) + (e.classList.contains("yes") ? ", right" : e.classList.contains("no") ? ", not this one" : e.getAttribute("aria-pressed") === "true" ? ", chosen" : ""); } },
    { sel: ".ch-work input:not([type=hidden]):not([type=checkbox])", base: "field", desc: function (e) { return (label(e) || "A box to fill in") + (e.value ? ": " + e.value : ""); } },
    { sel: ".ch-work button, .ch-work [role=button], .ch-work [role=slider], .ch-work [draggable=true], .ch-work input[type=checkbox]", base: "control", desc: function (e) { return label(e) || "A control"; } },
    { sel: ".ch-hint", base: "hint", desc: function () { return "Ask for a hint."; } },
    { sel: ".ch-show", base: "show-me", desc: function () { return "Show the answer."; } },
    { sel: ".ch-foot .ch-btn.primary", base: "check", desc: function (e) { return label(e) + (e.disabled ? ". Not yet: answer first." : "."); } }
  ];
  function annotate(card) {
    SPECS.forEach(function (sp) {
      var list = [].filter.call(card.querySelectorAll(sp.sel), function (e) {
        return (!e.__feelSpec || e.__feelSpec === sp.base) && !e.closest(".k1-voice,.feel-sw") && !(sp.base === "field" && e.closest(".ch-num"));
      });
      list.forEach(function (e, i) {
        if (!e.__feelSpec) {
          e.__feelSpec = sp.base;
          var base = sp.base === "check" ? (slug(label(e)) || "check") : sp.base;
          e.setAttribute(A.node, "true");
          e.setAttribute(A.name, list.length > 1 && sp.base !== "check" ? base + "-" + (i + 1) : base);
        }
        e.setAttribute(A.desc, sp.desc(e));      // the sentence is kept current
      });
    });
  }
  function graph(card) {
    annotate(card);
    return [].map.call(card.querySelectorAll("[" + A.name + "]"), function (e) {
      return { name: e.getAttribute(A.name), description: e.getAttribute(A.desc) || "", el: e };
    });
  }
  function text(card) {
    return graph(card).map(function (n) { return "\t" + n.name + ": " + n.description; }).join("\n");
  }
  // actions: [ { tag: "highlight", ids: [...] } | { tag: "clear" } ] → { rejected: [names not in the step] }
  function act(card, actions) {
    var rejected = [], g = graph(card), by = {};
    g.forEach(function (n) { by[n.name] = n.el; });
    (actions || []).forEach(function (a) {
      if (!a) return;
      if (a.tag === "clear") { [].forEach.call(card.querySelectorAll(".feel-glow"), function (e) { e.classList.remove("feel-glow"); e.removeAttribute("data-synced-to-pulse-timer"); }); return; }
      if (a.tag !== "highlight") return;
      (a.ids || []).forEach(function (id) {
        var e = typeof id === "string" ? by[id] : null;
        if (!e) { rejected.push(id); return; }
        e.classList.add("feel-glow"); e.setAttribute("data-synced-to-pulse-timer", "");
      });
    });
    return { rejected: rejected };
  }

  /* ================================================================ Card hook
     Runs on every step; acts only on Kern, and only inside a course that has
     asked for it. Grade 1's own steps (s.k1) are handled by its kit. */
  var COURSES = { prealg: 1 };
  var IDLE_MS = 8000, IDLE_LEARN_MS = 12000;
  function idle(ms) { return window.__OPLO_TEST && window.__FEEL_IDLE ? window.__FEEL_IDLE : ms; }
  var bellOn = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 5.5 2 7 2 7H4s2-1.5 2-7"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>';
  var bellOff = bellOn.replace("</svg>", '<path d="m4 4 16 16"/></svg>');

  function hook(card, s, reg) {
    if (!window.OPLO_KERN || !s || s.k1) return;
    var live = true, timers = [], cleanups = [];
    reg(function () { live = false; timers.forEach(clearTimeout); cleanups.forEach(function (f) { f(); }); });
    // The card is put in the page just after the hook runs: look at where it landed.
    timers.push(setTimeout(function () {
      if (!live) return;
      var host = card.closest("[data-course]"), course = host && host.getAttribute("data-course");
      if (!COURSES[course]) return;
      begin(card, s, timers, cleanups, function () { return live; });
    }, 0));
  }

  function begin(card, s, timers, cleanups, alive) {
    card.setAttribute("data-feel", "1");
    var isEnd = card.classList.contains("ch-end");
    var clk = clock(card, { cls: "feel-pulsing" });
    cleanups.push(clk.destroy);

    // The switch.
    if (SFX.can && !isEnd) {
      var bw = document.createElement("button");
      bw.type = "button"; bw.className = "feel-sw";
      bw.setAttribute("role", "switch"); bw.setAttribute("aria-label", "Play little sounds");
      var sync = function (on) { bw.innerHTML = on ? bellOn : bellOff; bw.setAttribute("aria-checked", String(on)); bw.classList.toggle("off", !on); bw.title = on ? "Little sounds are on. Press to turn them off." : "Little sounds are off. Press to turn them on."; };
      sync(SFX.isOn());
      bw.addEventListener("click", function () { SFX.set(!SFX.isOn()); SFX.play("tap"); });
      SFX.sub(sync);
      card.insertBefore(bw, card.firstChild);
    }
    if (isEnd) { SFX.play("done"); return; }

    // The verdict, once each time it changes; a tap for every other press.
    var heard = "";
    function verdict() {
      var sh = card.querySelector(".ch-sheet.on");
      if (!sh) { heard = ""; return; }
      var kind = sh.classList.contains("ok") ? "yes" : sh.classList.contains("no") ? "no" : sh.classList.contains("shown") ? "shown" : "";
      if (kind && kind !== heard) { heard = kind; SFX.play(kind); }
    }
    var pending = null;
    var mo = typeof MutationObserver === "function" ? new MutationObserver(function () {
      verdict();
      if (!pending) pending = setTimeout(function () { pending = null; if (alive()) annotate(card); }, 60);
    }) : null;
    if (mo) { mo.observe(card, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "aria-pressed", "disabled"] }); cleanups.push(function () { mo.disconnect(); clearTimeout(pending); }); }
    card.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("button, [role=button]");
      if (!b || b.disabled || b.classList.contains("feel-sw")) return;
      // Check is answered by its verdict; everything else, with a tap.
      if (b.matches(".ch-foot .ch-btn.primary") && /check/i.test(b.textContent)) return;
      SFX.play(b.matches(".ch-hint") ? "hint" : "tap");
    });
    annotate(card);

    /* The quiet moment. */
    var idleT = null, lit = false;
    function primary() { return card.querySelector(".ch-foot .ch-btn.primary"); }
    function target() {
      var p = primary();
      if (card.querySelector(".ch-sheet.ok, .ch-sheet.shown")) return p && !p.hidden ? p : null;         // solved: on to the next
      if (p && !p.hidden && !p.disabled && /check/i.test(p.textContent)) return p;                       // ready: check it
      var inp = card.querySelector(".ch-num input:not(:disabled)");
      if (inp && !inp.value) return inp.closest(".ch-num");                                              // a box to fill
      var opts = card.querySelector(".ch-options");
      if (opts && !opts.querySelector(".on,.yes")) return opts;                                          // answers to choose from
      var first = card.querySelector(".ch-work [" + A.name + "]");
      if (first && s.type !== "learn") return first;                                                     // a figure to work
      if (s.type === "learn" && p && !p.hidden) return p;                                                // a page to read: on when ready
      return null;
    }
    function go() {
      if (!alive()) return;
      var t = target();
      if (!t) return;
      annotate(card);
      var name = t.getAttribute(A.name);
      if (!name) return;                       // only what the graph names is pointed at
      act(card, [{ tag: "clear" }, { tag: "highlight", ids: [name] }]);
      clk.play(); lit = true;
    }
    function arm() { clearTimeout(idleT); idleT = setTimeout(go, idle(s.type === "learn" ? IDLE_LEARN_MS : IDLE_MS)); timers.push(idleT); }
    function calm() {
      if (lit) { lit = false; clk.settle(function () { act(card, [{ tag: "clear" }]); }); }
      arm();
    }
    card.addEventListener("pointerdown", calm, true);
    card.addEventListener("keydown", calm, true);
    arm();
  }

  window.OPLO_FEEL = { SFX: SFX, clock: clock, graph: graph, text: text, act: act, annotate: annotate, hook: hook, COURSES: COURSES, PERIOD: PERIOD, reduced: reduced };
  if (CH) { (CH.cardHooks = CH.cardHooks || []).push(hook); }
})();
