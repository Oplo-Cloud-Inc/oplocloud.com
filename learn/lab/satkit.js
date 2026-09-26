/* ==========================================================================
   OEdu Lab — the SAT kit. See lab/core.js (COURSE_KIT, addHub).

   SAT Math, taught as a loop rather than a pile of questions:

     Diagnose → Understand → Practice → Explain → Transfer → Re-test → Master

   not Question → Wrong → Explanation → Next question. Everything a student
   sees in the course is built here, on top of the lab's typesetter and the
   challenge player:

     the hub        the course page: an estimated score with its honest range,
                    the SAT Map (every skill, how well it is understood, where
                    it is in the mastery loop), today's mission, the biggest
                    opportunity, and what the practice says about how points
                    are lost — errors, confidence, pacing
     brain scan     an adaptive diagnostic: every skill once, harder or easier
                    as it goes, with a confidence tap on every answer and no
                    marks until the end
     the player     a question the way the digital SAT sets it — four choices
                    you can cross out, or a box for your own answer, a
                    calculator that graphs, the reference sheet — and a coach
                    behind it: a wrong answer is never followed by the answer.
                    First "what were you thinking?", then the idea rebuilt one
                    small question at a time, then the explanation in layers
                    (hint, strategy, walkthrough, concept), then the same idea
                    in a different disguise
     sessions       today's mission, "I have 10 minutes", and an 8-minute fix
                    for one skill: learn → guided → on your own → different
                    disguise → against the clock
     module         a timed module like the real one: 22 questions in 35
                    minutes, flags, a question map, and a pacing report after
     error lab      every missed question, classified and taken apart
     library        the strategies, searchable, each with a worked example and
                    a way to try it at once
     recognition    a quick game: what kind of question is this?
     target         where the points are, skill by skill, for the score you
                    are working toward — never a promise

   The skills themselves — their generators, lessons and strategies — are in
   learn/sat/u01.js … u04.js, one file per domain, which register themselves
   through SAT.domain(). Every question is made fresh from a seed, so a missed
   one can be brought back exactly as it was.

   All colour comes from the app's tokens, so the kit sits on the student
   side's Obsidian as well as on the light console.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_LAB || !window.OPLO_CHALLENGE) return;
  var LAB = window.OPLO_LAB, CH = window.OPLO_CHALLENGE;
  var el = LAB.el, esc = LAB.esc, button = LAB.button, m = LAB.m, num = LAB.num;
  /* The lab's text-with-math, with one change: punctuation right after a
     piece of math stays on its line ("… of $x$?" never leaves the "?"
     alone at the start of the next one). */
  function fmt(text) {
    if (typeof text !== "string" || text.indexOf("$") < 0) return LAB.fmt(text);
    text = text.replace(/\\\$/g, "\u0002")
      .replace(/(\$[^$]+\$)([.,?!;:)]+)/g, '<span class="st-nw">$1$2</span>')
      .replace(/\u0002/g, "\\$");
    return LAB.fmt(text);
  }
  var SAT = LAB.SAT = LAB.SAT || {};
  var NS = "http://www.w3.org/2000/svg";

  /* =============================================================== Parts */
  function icon(d, cls) {
    return '<svg class="st-i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }
  var I = {
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    back: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="m7 7 10 10M17 7 7 17"/>',
    brain: '<path d="M9.5 4.5a3 3 0 0 0-3 3v.2A3 3 0 0 0 4.5 13a3 3 0 0 0 2 4.7 3 3 0 0 0 3 1.8V4.5z"/><path d="M14.5 4.5a3 3 0 0 1 3 3v.2a3 3 0 0 1 2 5.3 3 3 0 0 1-2 4.7 3 3 0 0 1-3 1.8V4.5z"/><path d="M9.5 9H8M9.5 14H7.5M14.5 9H16M14.5 14h2"/>',
    map: '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    flag: '<path d="M5.5 21V4"/><path d="M5.5 4.5h11l-2.2 4 2.2 4h-11"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    bolt: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3 2-5.2 3.4-6.6.3 1.6 1.2 2.7 2.3 3.2-.4-3 .9-5.9 3.3-7.9.2 2.8 1.7 4.4 3 6 1 1.3 1.5 3 1.5 4.9 0 4-2.9 6.6-7 6.6z"/>',
    lab: '<path d="M9.5 3v6L4.8 17.6A2.3 2.3 0 0 0 6.8 21h10.4a2.3 2.3 0 0 0 2-3.4L14.5 9V3"/><path d="M8 3h8M7.2 14.5h9.6"/>',
    scope: '<path d="M6 18h10"/><path d="M9 18a6 6 0 0 0 9.5-4.9"/><path d="m10.5 4.5 4 7"/><path d="m8.8 5.5 3.4-2 4.6 8-3.4 2z"/><path d="M11 21h7"/>',
    book: '<path d="M4 5.5h5.5A2.5 2.5 0 0 1 12 8v11a2 2 0 0 0-2-2H4z"/><path d="M20 5.5h-5.5A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    mask: '<path d="M3.5 7.5c3-1.3 14-1.3 17 0 0 6-2.6 9-5.2 9-1.6 0-2.3-2-3.3-2s-1.7 2-3.3 2c-2.6 0-5.2-3-5.2-9z"/><path d="M7.5 11h2.2M14.3 11h2.2"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
    steps: '<path d="M4 19h5v-5h5V9h6"/><path d="M4 19v-3"/>',
    layers: '<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z"/><path d="m3.5 12 8.5 4.5 8.5-4.5"/><path d="m3.5 16 8.5 4.5 8.5-4.5"/>',
    calc: '<rect x="5.5" y="3" width="13" height="18" rx="2.5"/><path d="M8.5 7h7"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
    ref: '<path d="M7 3.5h6.5l5 5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M13.5 3.5v5h5"/><path d="M8.5 13h7M8.5 16.5h5"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 4.5 4.5"/>',
    play: '<path d="M8 5.5 18 12 8 18.5z"/>',
    spark: '<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4"/><circle cx="12" cy="12" r="2.2"/>',
    chat: '<path d="M4.5 5.5h15v10h-8l-4.5 4v-4h-2.5z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/>',
    school: '<path d="m12 4 9 4.5-9 4.5-9-4.5z"/><path d="M6.5 10.3v4.2c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.2"/><path d="M21 8.5v5"/>',
    loop: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5"/><path d="M9.5 3h5M12 3v3"/>',
    strike: '<path d="M4 12h16"/><path d="M8 7.5c0-1.4 1.8-2.5 4-2.5s4 1.1 4 2.5"/><path d="M16 16.5c0 1.4-1.8 2.5-4 2.5s-4-1.1-4-2.5"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    trend: '<path d="M4 17 9.5 11.5l3.5 3.5L20 8"/><path d="M15 8h5v5"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
    tri: '<path d="M12 4 21 19H3z"/>',
    sigma: '<path d="M17 5H7l6 7-6 7h10"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5" rx=".6"/><rect x="12" y="8" width="3" height="9" rx=".6"/><rect x="17" y="10" width="3" height="7" rx=".6"/>',
    fx: '<path d="M4 18c3 0 3-12 6-12"/><path d="M5 11h5"/><path d="m13 9 6 8M19 9l-6 8"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    list: '<path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
    pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    rocket: '<path d="M12 15.5c-1.2-1.6-1.9-3.3-2.1-5.2C9.6 7.4 11 4.6 13.9 3c1.5 3.2 1.4 6.6-.5 9.7"/><path d="M9.9 10.3 6 12.5l2 2.2"/><path d="M13.4 12.7 12.9 17l-2.3-1.7"/><path d="M8.2 17.2c-1 .7-1.9 2-2.2 3.3 1.3-.3 2.6-1.2 3.3-2.2"/>'
  };

  /* Each part adds its rules once, into the kit's own <style>. */
  var styleEl = null;
  function css(text) {
    if (!styleEl) {
      var old = document.getElementById("satkit-css");
      if (old) old.remove();
      styleEl = document.createElement("style");
      styleEl.id = "satkit-css";
      document.head.appendChild(styleEl);
    }
    styleEl.appendChild(document.createTextNode(Array.isArray(text) ? text.join("\n") : text));
  }
  function reduced() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  /* A number that counts to its value — the one place a little motion earns
     its keep: a skill going from 48% to 61% should be seen to go there. */
  function countUp(node, from, to, ms, suffix) {
    suffix = suffix || "";
    if (reduced() || from === to) { node.textContent = to + suffix; return; }
    var t0 = null;
    function f(t) {
      if (!node.isConnected && t0 != null) return;
      if (t0 == null) t0 = t;
      var k = Math.min(1, (t - t0) / (ms || 900));
      var e = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(from + (to - from) * e) + suffix;
      if (k < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
    // A hidden pane draws no frames; the number must still end right.
    setTimeout(function () { node.textContent = to + suffix; }, (ms || 900) + 400);
  }
  function mmss(s) {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }
  function dayKey(t) {
    var d = new Date(t == null ? Date.now() : t);
    return d.getFullYear() + "-" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate();
  }
  var DAY = 86400000;
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function pct(x) { return Math.round(x * 100); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sigma(z) { return 1 / (1 + Math.exp(-z)); }
  function strip(t) { return String(t == null ? "" : t).replace(/<[^>]+>/g, "").replace(/\$([^$]+)\$/g, "$1").replace(/\\[a-z]+/g, "").replace(/[{}]/g, ""); }
  function seedNow() { return Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function focusSoon(n) { requestAnimationFrame(function () { if (n && n.focus) n.focus({ preventScroll: true }); }); }
  function scrollIntoViewSoft(n) {
    if (!n) return;
    requestAnimationFrame(function () {
      var r = n.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 24 || r.top < 60) {
        window.scrollTo({ top: Math.max(0, window.scrollY + r.top - 110), behavior: reduced() ? "auto" : "smooth" });
      }
    });
  }
  function toTop() { window.scrollTo({ top: 0, behavior: "auto" }); }

  SAT.icon = icon; SAT.I = I; SAT.css = css;

  /* ================================================================ Look
     One accent for the course (teal), one colour per domain (blue Algebra,
     violet Advanced Math, green Data, orange Geometry), and the app's own
     tokens for everything else — so the same rules sit on the light console
     and on the student side's Obsidian. */
  css([
    ".st-root, .st-tool, .st-toast, .st-q, .st-fig, .ch-card {",
    "  --st-teal: #0d9488; --st-teal-2: #14b8a6;",
    "  --st-d1: #3b6ef6; --st-d2: #8b5cf6; --st-d3: #12a15f; --st-d4: #ea7a22;",
    "  --st-good: #12a15f; --st-mid: #e0a100; --st-low: #e5484d; --st-none: color-mix(in srgb, var(--ink) 22%, transparent);",
    "  --st-tint: color-mix(in srgb, var(--st-teal) 12%, transparent);",
    "  --st-line: color-mix(in srgb, var(--ink) 11%, transparent);",
    "  --st-r: 22px;",
    "}",
    "html[data-look=\"obsidian\"] .st-root, html[data-look=\"obsidian\"] .st-tool, html[data-look=\"obsidian\"] .st-toast, html[data-look=\"obsidian\"] .st-q, html[data-look=\"obsidian\"] .st-fig, html[data-look=\"obsidian\"] .ch-card {",
    "  --st-teal: #2dd4bf; --st-teal-2: #5eead4;",
    "  --st-d1: #6b95ff; --st-d2: #a78bfa; --st-d3: #3ddc84; --st-d4: #ffa04a;",
    "  --st-good: #3ddc84; --st-mid: #ffc53d; --st-low: #ff6b6e;",
    "  --st-tint: color-mix(in srgb, var(--st-teal) 14%, transparent);",
    "}",
    ".st-root { font-family: var(--text); color: var(--ink); }",
    ".st-root button, .st-q button, .st-tool button { font: inherit; color: inherit; cursor: pointer; }",
    ".st-i { width: 18px; height: 18px; flex: none; }",
    /* the page is wider than a reading page, but never sprawls */
    ".lx-wrap:has(#v-course.on .st-hub), .lx-wrap:has(#v-lab.on .st-page) { max-width: 1120px; }",
    ".st-hub, .st-page { display: grid; gap: 18px; padding-bottom: 40px; }",
    ".st-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; letter-spacing: .01em; color: var(--ink-3); }",
    ".st-eyebrow .st-i { width: 15px; height: 15px; }",
    ".st-lede { font-size: 16.5px; line-height: 1.55; color: var(--ink-2); margin: 0; max-width: 62ch; }",
    ".st-muted { color: var(--ink-3); font-size: 13.5px; line-height: 1.5; margin: 0; }",
    ".st-muted b { color: var(--ink-2); }",
    ".st-h2 { font-family: var(--font); font-size: 22px; font-weight: 700; letter-spacing: -.01em; margin: 10px 0 2px; }",
    ".st-sub { color: var(--ink-3); margin: 0 0 12px; font-size: 14px; }",
    ".st-lbl { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; color: var(--ink-3); margin: 0 0 6px; }",
    ".st-lbl .st-i { width: 14px; height: 14px; }",
    /* cards */
    ".st-card { background: var(--paper); border-radius: var(--st-r); padding: 22px 24px; box-shadow: 0 0 0 1px var(--hair); min-width: 0; }",
    ".st-card-h { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }",
    ".st-card-h > .st-i { width: 36px; height: 36px; padding: 8px; border-radius: 11px; background: var(--st-tint); color: var(--st-teal); }",
    ".st-card-h h3 { font-family: var(--font); font-size: 17px; font-weight: 650; margin: 1px 0 3px; letter-spacing: -.005em; }",
    ".st-card-h p { margin: 0; font-size: 13.5px; color: var(--ink-3); line-height: 1.45; }",
    ".st-card-h > div { flex: 1; min-width: 0; }",
    ".st-row2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; }",
    ".st-row3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }",
    "@media (max-width: 1000px) { .st-row3 { grid-template-columns: 1fr 1fr; } }",
    /* buttons */
    ".st-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 18px; border-radius: 999px; background: var(--sunk); font-weight: 600; font-size: 14.5px; border: 0; transition: background .15s var(--ease), transform .12s var(--ease), box-shadow .15s var(--ease); white-space: nowrap; }",
    ".st-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--ink) 12%, var(--paper)); }",
    ".st-btn:active:not(:disabled) { transform: scale(.98); }",
    ".st-btn:disabled { opacity: .45; cursor: default; }",
    ".st-btn.primary { background: var(--blue); color: #fff; }",
    "html[data-look=\"obsidian\"] .st-btn.primary { background: var(--fill, #0071e3); }",
    ".st-btn.primary:hover:not(:disabled) { background: var(--blue-d); }",
    "html[data-look=\"obsidian\"] .st-btn.primary:hover:not(:disabled) { background: var(--fill-d, #0068d6); }",
    ".st-btn.lg { height: 50px; padding: 0 24px; font-size: 16px; }",
    ".st-btn.sm { height: 34px; padding: 0 14px; font-size: 13.5px; }",
    ".st-btn.ghost { background: transparent; box-shadow: inset 0 0 0 1px var(--rule); }",
    ".st-btn .st-i { width: 17px; height: 17px; }",
    ".st-link { background: none; border: 0; padding: 4px 0; color: var(--blue); font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }",
    ".st-link:hover { text-decoration: underline; }",
    ".st-link .st-i { width: 15px; height: 15px; transition: transform .2s var(--ease); }",
    ".st-link.open .st-i { transform: rotate(180deg); }",
    ".st-acts { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 16px; }",
    ".st-acts.center { justify-content: center; }",
    ".st-btn:focus-visible, .st-ch-b:focus-visible, .st-conf-b:focus-visible, .st-tile:focus-visible, .st-map-r:focus-visible { outline: 3px solid color-mix(in srgb, var(--blue) 55%, transparent); outline-offset: 2px; }",
    /* bars and dots */
    ".st-bar { position: relative; display: block; height: 7px; border-radius: 99px; background: var(--sunk); overflow: hidden; min-width: 40px; }",
    ".st-bar > i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: inherit; background: var(--st-teal); transition: width .9s cubic-bezier(.2,.7,.2,1); }",
    ".st-bar.good > i { background: var(--st-good); } .st-bar.mid > i { background: var(--st-mid); } .st-bar.low > i { background: var(--st-low); }",
    ".st-bar.d1 > i { background: var(--st-d1); } .st-bar.d2 > i { background: var(--st-d2); } .st-bar.d3 > i { background: var(--st-d3); } .st-bar.d4 > i { background: var(--st-d4); }",
    ".st-bar.conf > i { background: var(--st-teal); } .st-bar.slow > i { background: var(--st-mid); } .st-bar.fast > i { background: var(--st-good); }",
    ".st-bar.b-concept > i { background: var(--st-d2); } .st-bar.b-misread > i { background: var(--st-d1); } .st-bar.b-careless > i { background: var(--st-mid); } .st-bar.b-strategy > i { background: var(--st-d4); } .st-bar.b-time > i { background: var(--st-low); }",
    ".st-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--st-none); flex: none; }",
    ".st-dot.good { background: var(--st-good); } .st-dot.mid { background: var(--st-mid); } .st-dot.low { background: var(--st-low); }",
    ".st-loop { display: inline-flex; gap: 3px; align-items: center; }",
    ".st-loop i { width: 12px; height: 6px; border-radius: 3px; background: var(--sunk); }",
    ".st-loop i.on { background: var(--st-teal); }",
    ".st-loop i.new { animation: st-pop .9s var(--ease) both; }",
    "@keyframes st-pop { 0% { transform: scale(.4); background: var(--st-teal-2); } 60% { transform: scale(1.35); } 100% { transform: scale(1); } }",
    ".st-chip { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 99px; font-size: 12px; font-weight: 600; background: var(--sunk); color: var(--ink-2); }",
    ".st-chip.d1 { color: var(--st-d1); background: color-mix(in srgb, var(--st-d1) 13%, transparent); } .st-chip.d2 { color: var(--st-d2); background: color-mix(in srgb, var(--st-d2) 13%, transparent); }",
    ".st-chip.d3 { color: var(--st-d3); background: color-mix(in srgb, var(--st-d3) 13%, transparent); } .st-chip.d4 { color: var(--st-d4); background: color-mix(in srgb, var(--st-d4) 13%, transparent); }",
    ".in { animation: st-in .38s cubic-bezier(.2,.7,.2,1) both; }",
    "@keyframes st-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }",
    "@media (prefers-reduced-motion: reduce) { .in, .st-loop i.new { animation: none; } .st-bar > i { transition: none; } }"
  ]);

  /* ------------------------------------------------------------- Hub */
  css([
    ".st-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 4px 2px 6px; flex-wrap: wrap; }",
    ".st-hero h1 { font-family: var(--font); font-size: 46px; font-weight: 700; letter-spacing: -.025em; margin: 4px 0 6px; line-height: 1.05; }",
    ".st-hero-sub { margin: 0; color: var(--ink-2); font-size: 16px; }",
    ".st-hero-r { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }",
    ".st-pill { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border-radius: 99px; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); font-size: 13px; color: var(--ink-3); }",
    ".st-pill b { color: var(--ink); font-size: 15px; font-variant-numeric: tabular-nums; }",
    ".st-pill .st-i { width: 16px; height: 16px; }",
    ".st-pill.hot .st-i { color: #ff8a1f; fill: color-mix(in srgb, #ff8a1f 30%, transparent); }",
    ".st-soc { display: inline-flex; align-items: center; gap: 10px; height: 38px; padding: 0 14px 0 8px; border-radius: 99px; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); border: 0; text-align: left; }",
    ".st-soc b { display: block; font-size: 12.5px; line-height: 1.1; } .st-soc em { display: block; font-style: normal; font-size: 11px; color: var(--ink-3); line-height: 1.2; }",
    ".st-sw { width: 34px; height: 20px; border-radius: 99px; background: var(--sunk); position: relative; flex: none; transition: background .2s var(--ease); box-shadow: inset 0 0 0 1px var(--rule); }",
    ".st-sw i { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .2s var(--ease); }",
    ".st-soc.on .st-sw { background: var(--st-teal); box-shadow: none; } .st-soc.on .st-sw i { transform: translateX(14px); }",
    /* invite */
    ".st-invite { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 28px; align-items: center; padding: 30px 32px;",
    "  background: radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--st-teal) 16%, var(--paper)) 0%, var(--paper) 55%); }",
    ".st-invite h2 { font-family: var(--font); font-size: 32px; font-weight: 700; letter-spacing: -.02em; margin: 8px 0 10px; }",
    ".st-inv-list { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 10px; }",
    ".st-inv-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14.5px; color: var(--ink-2); }",
    ".st-inv-list .st-i { color: var(--st-teal); margin-top: 1px; }",
    ".st-inv-list b { color: var(--ink); }",
    ".st-inv-r { display: grid; gap: 10px; justify-items: stretch; }",
    ".st-inv-r .st-link { justify-self: center; }",
    ".st-resume { display: flex; gap: 8px; align-items: center; margin: 0; padding: 10px 12px; border-radius: 12px; background: var(--st-tint); font-size: 13.5px; color: var(--ink-2); }",
    /* score */
    ".st-score .st-score-row { display: flex; align-items: baseline; gap: 8px; margin: 6px 0 12px; }",
    ".st-score-n { font-family: var(--font); font-size: 62px; font-weight: 700; letter-spacing: -.03em; line-height: 1; font-variant-numeric: tabular-nums; }",
    ".st-score-n.dim { color: var(--ink-3); display: block; margin: 6px 0; }",
    ".st-score-of { color: var(--ink-3); font-size: 16px; font-weight: 600; }",
    ".st-score.big .st-score-n { font-size: 76px; }",
    ".st-range { position: relative; height: 10px; border-radius: 99px; background: var(--sunk); margin: 4px 0 26px; }",
    ".st-range-band { position: absolute; top: 0; bottom: 0; border-radius: 99px; background: color-mix(in srgb, var(--st-teal) 45%, transparent); }",
    ".st-range-dot { position: absolute; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; background: var(--st-teal); box-shadow: 0 0 0 4px var(--paper); }",
    ".st-range-goal { position: absolute; top: -5px; bottom: -5px; width: 3px; margin-left: -1.5px; border-radius: 2px; background: var(--ink); }",
    ".st-range-t { position: absolute; top: 16px; transform: translateX(-50%); font-size: 11px; color: var(--ink-3); font-variant-numeric: tabular-nums; }",
    ".st-range-t:first-of-type { transform: none; } .st-range-t:last-of-type { transform: translateX(-100%); }",
    ".st-doms { display: grid; gap: 9px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--hair); }",
    ".st-dom { display: grid; grid-template-columns: minmax(0, 1.25fr) auto minmax(60px, 1fr) 42px; gap: 10px; align-items: center; font-size: 13.5px; }",
    ".st-dom-n { display: inline-flex; align-items: center; gap: 7px; font-weight: 600; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".st-dom-n .st-i { width: 15px; height: 15px; }",
    ".st-dom.d1 .st-dom-n .st-i { color: var(--st-d1); } .st-dom.d2 .st-dom-n .st-i { color: var(--st-d2); } .st-dom.d3 .st-dom-n .st-i { color: var(--st-d3); } .st-dom.d4 .st-dom-n .st-i { color: var(--st-d4); }",
    ".st-dom-w { font-size: 11.5px; color: var(--ink-3); white-space: nowrap; }",
    ".st-dom b { text-align: right; font-variant-numeric: tabular-nums; }",
    /* mission */
    ".st-mission { display: flex; flex-direction: column; }",
    ".st-mission .st-card-h > .st-i { color: #ff8a1f; background: color-mix(in srgb, #ff8a1f 14%, transparent); }",
    ".st-mlist { list-style: none; padding: 0; margin: 0 0 12px; display: grid; gap: 7px; counter-reset: m; }",
    ".st-mlist li { display: flex; align-items: center; gap: 10px; font-size: 14.5px; }",
    ".st-mmin { flex: none; min-width: 52px; text-align: center; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 8px; background: var(--sunk); color: var(--ink-2); font-variant-numeric: tabular-nums; }",
    ".st-mgoal { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; padding: 10px 12px; border-radius: 12px; background: var(--st-tint); font-size: 14px; }",
    ".st-mgoal .st-i { color: var(--st-teal); }",
    ".st-mission > .st-btn { align-self: flex-start; }",
    ".st-time { display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 16px; flex-wrap: wrap; }",
    ".st-time-l { font-size: 13px; color: var(--ink-3); margin-right: 4px; }",
    ".st-time-b { display: inline-flex; align-items: baseline; gap: 3px; height: 36px; padding: 0 12px; border-radius: 12px; border: 0; background: var(--sunk); transition: background .15s var(--ease), transform .12s var(--ease); }",
    ".st-time-b b { font-size: 15px; font-variant-numeric: tabular-nums; } .st-time-b span { font-size: 11px; color: var(--ink-3); }",
    ".st-time-b:hover { background: var(--st-tint); transform: translateY(-1px); }",
    /* opportunity */
    ".st-opp { display: flex; align-items: center; gap: 24px; justify-content: space-between; position: relative; overflow: hidden; padding: 26px 28px; }",
    ".st-opp::before { content: \"\"; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--st-teal); }",
    ".st-opp.d1::before { background: var(--st-d1); } .st-opp.d2::before { background: var(--st-d2); } .st-opp.d3::before { background: var(--st-d3); } .st-opp.d4::before { background: var(--st-d4); }",
    ".st-opp h2 { font-family: var(--font); font-size: 27px; font-weight: 700; letter-spacing: -.02em; margin: 6px 0 6px; }",
    ".st-opp-why { margin: 0 0 12px; font-size: 16px; color: var(--ink-2); }",
    ".st-opp-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; margin: 0; font-size: 13px; color: var(--ink-3); }",
    ".st-opp-meta b { color: var(--ink); }",
    ".st-opp-r { display: grid; gap: 8px; flex: none; }",
    ".st-opp .st-eyebrow .st-i { color: var(--st-mid); }",
    /* map */
    ".st-map .st-card-h { flex-wrap: wrap; }",
    ".st-legend { display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; color: var(--ink-3); margin-left: auto; align-self: center; }",
    ".st-legend span { display: inline-flex; align-items: center; gap: 5px; }",
    ".st-map-d { margin-top: 6px; }",
    ".st-map-d + .st-map-d { margin-top: 14px; }",
    ".st-map-dh { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-bottom: 1px solid var(--hair); }",
    ".st-map-dn { display: inline-flex; align-items: center; gap: 8px; font-size: 14.5px; }",
    ".st-map-d.d1 .st-map-dn .st-i { color: var(--st-d1); } .st-map-d.d2 .st-map-dn .st-i { color: var(--st-d2); } .st-map-d.d3 .st-map-dn .st-i { color: var(--st-d3); } .st-map-d.d4 .st-map-dn .st-i { color: var(--st-d4); }",
    ".st-map-dw { font-size: 12px; color: var(--ink-3); }",
    ".st-map-dp { margin-left: auto; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 14px; }",
    ".st-map-r { display: grid; grid-template-columns: minmax(0, 1fr) 210px 12px 102px 110px; gap: 14px; align-items: center; width: 100%; padding: 10px 10px; border: 0; background: none; text-align: left; border-radius: 12px; transition: background .15s var(--ease); }",
    ".st-map-r:hover { background: var(--sunk); }",
    ".st-map-s b { font-weight: 550; font-size: 14.5px; }",
    ".st-map-u { display: flex; align-items: center; gap: 10px; }",
    ".st-map-u .st-bar { flex: 1; }",
    ".st-map-u em { font-style: normal; width: 36px; text-align: right; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }",
    ".st-map-r.untested .st-map-u em { color: var(--ink-3); font-weight: 500; }",
    ".st-map-go { display: inline-flex; align-items: center; justify-content: flex-end; gap: 8px; color: var(--ink-3); }",
    ".st-map-go .st-i { width: 16px; height: 16px; opacity: 0; transform: translateX(-4px); transition: opacity .15s, transform .15s var(--ease); }",
    ".st-map-r:hover .st-map-go .st-i { opacity: 1; transform: none; }",
    ".st-due { font-size: 11px; font-weight: 700; color: var(--st-teal); background: var(--st-tint); padding: 3px 8px; border-radius: 99px; white-space: nowrap; }",
    ".st-map-r.grow { animation: st-in .45s cubic-bezier(.2,.7,.2,1) both; animation-delay: var(--d, 0ms); }",
    ".st-map-r.grow .st-bar > i { animation: st-grow 1s cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(var(--d, 0ms) + 150ms); }",
    "@keyframes st-grow { from { width: 0; } }",
    /* insights */
    ".st-ins { display: flex; flex-direction: column; }",
    ".st-bars { display: grid; gap: 9px; }",
    ".st-brow { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(50px, 1fr) 40px; gap: 10px; align-items: center; font-size: 13.5px; }",
    ".st-brow b { text-align: right; font-variant-numeric: tabular-nums; }",
    ".st-brow .st-n { display: none; }",
    ".st-cconf { display: inline-flex; align-items: center; gap: 7px; }",
    ".st-cbars { display: inline-flex; align-items: flex-end; gap: 2px; height: 14px; }",
    ".st-cbars i { width: 3.5px; border-radius: 2px; background: color-mix(in srgb, var(--ink) 22%, transparent); }",
    ".st-cbars i:nth-child(1) { height: 5px; } .st-cbars i:nth-child(2) { height: 8px; } .st-cbars i:nth-child(3) { height: 11px; } .st-cbars i:nth-child(4) { height: 14px; }",
    ".st-cbars i.on { background: currentColor; }",
    ".st-ins-say { display: flex; gap: 8px; align-items: flex-start; margin: 14px 0 0; padding-top: 12px; border-top: 1px solid var(--hair); font-size: 13.5px; line-height: 1.5; color: var(--ink-2); }",
    ".st-ins-say .st-i { color: var(--st-teal); width: 16px; height: 16px; margin-top: 2px; }",
    ".st-ins > .st-btn { margin-top: 14px; align-self: flex-start; }",
    /* tools */
    ".st-tools { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }",
    ".st-tile { position: relative; display: grid; grid-template-columns: 42px 1fr; grid-template-rows: auto auto; column-gap: 12px; align-items: center; text-align: left; padding: 16px 18px; border-radius: 18px; border: 0; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); transition: transform .15s var(--ease), box-shadow .15s var(--ease); }",
    ".st-tile:hover { transform: translateY(-2px); box-shadow: 0 0 0 1px var(--rule), 0 12px 30px rgba(0,0,0,.12); }",
    ".st-tile-i { grid-row: 1 / 3; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: var(--st-tint); color: var(--st-teal); }",
    ".st-tile b { font-size: 15px; } .st-tile > span:not(.st-tile-i) { font-size: 12.5px; color: var(--ink-3); line-height: 1.35; }",
    ".st-badge { position: absolute; top: 12px; right: 12px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 99px; background: var(--st-low); color: #fff; font-style: normal; font-size: 12px; font-weight: 700; display: grid; place-items: center; }",
    ".st-domgrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }",
    "@media (max-width: 1000px) { .st-domgrid { grid-template-columns: 1fr 1fr; } }",
    ".st-domcard { display: grid; gap: 6px; align-content: start; text-align: left; padding: 18px; border-radius: 18px; border: 0; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); transition: transform .15s var(--ease); }",
    ".st-domcard:hover { transform: translateY(-2px); }",
    ".st-domcard-i { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 4px; }",
    ".st-domcard.d1 .st-domcard-i { color: var(--st-d1); background: color-mix(in srgb, var(--st-d1) 14%, transparent); } .st-domcard.d2 .st-domcard-i { color: var(--st-d2); background: color-mix(in srgb, var(--st-d2) 14%, transparent); }",
    ".st-domcard.d3 .st-domcard-i { color: var(--st-d3); background: color-mix(in srgb, var(--st-d3) 14%, transparent); } .st-domcard.d4 .st-domcard-i { color: var(--st-d4); background: color-mix(in srgb, var(--st-d4) 14%, transparent); }",
    ".st-domcard b { font-size: 15px; } .st-domcard > span:not(.st-domcard-i) { font-size: 12.5px; color: var(--ink-3); line-height: 1.4; } .st-domcard em { font-style: normal; font-size: 12px; color: var(--ink-2); font-weight: 600; margin-top: 4px; }",
    ".st-foot { font-size: 12px; color: var(--ink-3); text-align: center; max-width: 70ch; margin: 10px auto 0; line-height: 1.5; }"
  ]);

  /* ----------------------------------------------------------- Player */
  css([
    ".st-q:focus { outline: none; }",
    ".st-q { position: relative; max-width: 760px; margin: 0 auto; width: 100%; background: var(--paper); border-radius: 24px; padding: 22px 30px 26px; box-shadow: 0 0 0 1px var(--hair); font-family: var(--text); color: var(--ink); }",
    ".st-qh { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }",
    ".st-qwhere { display: flex; align-items: center; gap: 10px; }",
    ".st-qn { font-size: 13px; font-weight: 700; color: var(--ink-2); } .st-qn i { font-style: normal; color: var(--ink-3); font-weight: 500; }",
    ".st-qtools { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }",
    ".st-tb { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 11px; border-radius: 99px; border: 0; background: var(--sunk); font-size: 12.5px; font-weight: 600; color: var(--ink-2); transition: background .15s var(--ease), color .15s; }",
    ".st-tb:hover { color: var(--ink); background: color-mix(in srgb, var(--ink) 12%, var(--paper)); }",
    ".st-tb .st-i { width: 15px; height: 15px; }",
    ".st-coachb { background: var(--st-tint); color: var(--st-teal); }",
    ".st-flagb.on { background: color-mix(in srgb, var(--st-mid) 22%, transparent); color: var(--ink); }",
    ".st-flagb.on .st-i { fill: var(--st-mid); color: var(--st-mid); }",
    ".st-timer { position: relative; display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 11px; border-radius: 99px; border: 0; background: var(--sunk); font-size: 12.5px; color: var(--ink-2); overflow: hidden; }",
    ".st-timer b { font-variant-numeric: tabular-nums; font-size: 13px; color: var(--ink); min-width: 30px; }",
    ".st-timer .st-i { width: 15px; height: 15px; }",
    ".st-timer-aim { color: var(--ink-3); font-size: 11.5px; }",
    ".st-timer-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 2.5px; background: transparent; }",
    ".st-timer-bar > i { display: block; height: 100%; width: 0; background: var(--st-teal); transition: width .5s linear; }",
    ".st-timer.over .st-timer-bar > i { background: var(--st-mid); } .st-timer.over b { color: var(--st-mid); }",
    ".st-timer.off b, .st-timer.off .st-timer-aim, .st-timer.off .st-timer-bar { visibility: hidden; }",
    ".st-timer.off b { width: 0; min-width: 0; }",
    ".st-stem { font-size: 18.5px; line-height: 1.6; }",
    ".st-nw { white-space: nowrap; }",
    ".st-stem p { margin: 0 0 10px; }",
    ".st-stem .m.md { font-size: 1.28em; margin: 14px 0; }",
    ".st-qfig { margin: 14px 0 4px; }",
    ".st-fig { margin: 0 auto; text-align: center; }",
    ".st-fig-svg { width: 100%; height: auto; display: block; margin: 0 auto; overflow: visible; }",
    ".st-fig figcaption { font-size: 13.5px; color: var(--ink-2); margin-top: 6px; }",
    ".st-fig-note { font-size: 12.5px; font-style: italic; color: var(--ink-3); margin: 6px 0 0; }",
    ".st-inline-fig .st-fig { margin: 12px auto; }",
    /* figure strokes, from tokens */
    ".st-f-grid { stroke: color-mix(in srgb, var(--ink) 9%, transparent); stroke-width: 1; }",
    ".st-f-axis { stroke: color-mix(in srgb, var(--ink) 62%, transparent); stroke-width: 1.4; }",
    ".st-f-arrow { fill: color-mix(in srgb, var(--ink) 62%, transparent); }",
    ".st-f-ink { stroke: var(--ink); stroke-width: 1.8; fill: none; stroke-linecap: round; }",
    ".st-f-thin { stroke: var(--ink); stroke-width: 1.2; fill: none; }",
    ".st-f-thin.dash, .st-f-curve.dash { stroke-dasharray: 5 4; }",
    ".st-f-shape { fill: color-mix(in srgb, var(--st-d1, #3b6ef6) 9%, transparent); stroke: var(--ink); stroke-width: 1.8; stroke-linejoin: round; }",
    ".st-f-shape.soft { fill: color-mix(in srgb, var(--st-d1, #3b6ef6) 16%, transparent); } .st-f-shape.soft2 { fill: color-mix(in srgb, var(--st-d1, #3b6ef6) 24%, transparent); }",
    ".st-f-fill { stroke: none; } .st-f-fill.c-b { fill: color-mix(in srgb, var(--st-d1, #3b6ef6) 22%, transparent); } .st-f-fill.c-o { fill: color-mix(in srgb, var(--st-d4, #ea7a22) 22%, transparent); }",
    ".st-f-ring { fill: none; stroke: var(--ink); stroke-width: 1.8; }",
    ".st-f-curve { fill: none; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }",
    ".st-f-curve.c-b, .st-f-ink.c-b { stroke: var(--st-d1, #3b6ef6); } .st-f-curve.c-r { stroke: var(--st-low, #e5484d); } .st-f-curve.c-g { stroke: var(--st-good, #12a15f); } .st-f-curve.c-p { stroke: var(--st-d2, #8b5cf6); } .st-f-curve.c-o { stroke: var(--st-d4, #ea7a22); }",
    ".st-f-shade.c-b { fill: color-mix(in srgb, var(--st-d1, #3b6ef6) 14%, transparent); } .st-f-shade.c-r { fill: color-mix(in srgb, var(--st-low) 14%, transparent); }",
    ".st-f-pt { stroke: var(--paper); stroke-width: 2; } .st-f-pt.c-b { fill: var(--st-d1, #3b6ef6); } .st-f-pt.c-r { fill: var(--st-low); } .st-f-pt.c-g { fill: var(--st-good); } .st-f-pt.c-ink { fill: var(--ink); stroke: none; }",
    ".st-f-pt.open { fill: var(--paper); stroke: var(--st-d1, #3b6ef6); stroke-width: 2.2; }",
    ".st-f-t { fill: var(--ink); font-family: var(--lw-mathf, 'STIX Two Text', Georgia, serif); font-size: 16px; }",
    ".st-f-t.sm { font-size: 14px; } .st-f-t.xs { font-size: 11px; font-family: var(--text); }",
    ".st-f-t.c-o, .st-f-n.c-o { fill: var(--st-d4, #ea7a22); }",
    ".st-f-thin.c-o { stroke: var(--st-d4, #ea7a22); stroke-width: 1.6; }",
    ".st-f-n { fill: var(--ink-3); font-family: var(--text); font-size: 11.5px; font-variant-numeric: tabular-nums; } .st-f-n.xs { font-size: 10px; }",
    ".st-f-name { fill: var(--ink-2); font-family: var(--lw-mathf, Georgia, serif); font-style: italic; font-size: 15px; }",
    ".st-f-name.up { font-family: var(--text); font-style: normal; font-size: 12.5px; font-weight: 600; }",
    ".st-f-lab { font-family: var(--lw-mathf, Georgia, serif); font-size: 14px; } .st-f-lab.c-b { fill: var(--st-d1); } .st-f-lab.c-r { fill: var(--st-low); }",
    ".st-f-bar { fill: color-mix(in srgb, var(--st-d1, #3b6ef6) 70%, transparent); } .st-f-bar.hi { fill: var(--st-d4); }",
    ".st-tab-wrap { overflow-x: auto; margin: 4px 0; display: flex; justify-content: center; }",
    ".st-tab { border-collapse: separate; border-spacing: 0; font-size: 15.5px; border-radius: 12px; overflow: hidden; box-shadow: 0 0 0 1px var(--rule); }",
    ".st-tab caption { caption-side: top; font-size: 13.5px; color: var(--ink-2); padding-bottom: 8px; font-weight: 600; }",
    ".st-tab th, .st-tab td { padding: 9px 18px; text-align: center; border-bottom: 1px solid var(--hair); border-right: 1px solid var(--hair); }",
    ".st-tab tr > *:last-child { border-right: 0; } .st-tab tbody tr:last-child > * { border-bottom: 0; }",
    ".st-tab thead th { background: var(--sunk); font-weight: 650; font-size: 14px; }",
    ".st-tab.left tbody th { background: var(--sunk); font-weight: 600; text-align: left; }",
    /* choices */
    ".st-answer { margin-top: 20px; transition: opacity .25s var(--ease); }",
    ".st-answer.wait { opacity: .35; pointer-events: none; }",
    ".st-choices { display: grid; gap: 10px; }",
    ".st-ch { display: flex; align-items: stretch; gap: 8px; }",
    ".st-ch-b { flex: 1; display: flex; align-items: center; gap: 14px; min-height: 54px; padding: 10px 16px; border-radius: 14px; border: 0; background: var(--paper); box-shadow: inset 0 0 0 1.5px var(--rule); text-align: left; font-size: 16.5px; line-height: 1.4; transition: box-shadow .15s var(--ease), background .15s var(--ease); }",
    ".st-ch-b:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--ink) 40%, transparent); }",
    ".st-L { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--rule); font-size: 13.5px; font-weight: 700; color: var(--ink-2); transition: all .15s var(--ease); }",
    ".st-ch.on .st-ch-b { box-shadow: inset 0 0 0 2px var(--blue); background: color-mix(in srgb, var(--blue) 7%, var(--paper)); }",
    ".st-ch.on .st-L { background: var(--blue); color: #fff; box-shadow: none; }",
    ".st-ch.struck .st-ch-t, .st-ch.struck .st-L { opacity: .38; }",
    ".st-ch.struck .st-ch-t { text-decoration: line-through; text-decoration-thickness: 2px; }",
    ".st-ch-x { flex: none; width: 36px; border-radius: 12px; border: 0; background: transparent; color: var(--ink-3); font-size: 12px; font-weight: 700; position: relative; opacity: .55; transition: opacity .15s, background .15s; }",
    ".st-ch-x::after { content: \"\"; position: absolute; left: 9px; right: 9px; top: 50%; height: 1.6px; background: currentColor; transform: rotate(-18deg); }",
    ".st-ch:hover .st-ch-x, .st-ch-x:focus-visible { opacity: 1; } .st-ch-x:hover { background: var(--sunk); }",
    ".st-ch.struck .st-ch-x { opacity: 1; color: var(--ink); background: var(--sunk); }",
    ".st-ch.yes .st-ch-b { box-shadow: inset 0 0 0 2px var(--st-good); background: color-mix(in srgb, var(--st-good) 9%, var(--paper)); opacity: 1; }",
    ".st-ch.yes .st-L { background: var(--st-good); color: #fff; box-shadow: none; }",
    ".st-ch.no .st-ch-b { box-shadow: inset 0 0 0 2px var(--st-low); background: color-mix(in srgb, var(--st-low) 8%, var(--paper)); }",
    ".st-ch.no .st-L { background: var(--st-low); color: #fff; box-shadow: none; }",
    ".st-q.locked .st-ch-b:disabled { cursor: default; }",
    ".st-q.locked .st-ch:not(.yes):not(.no):not(.on) .st-ch-b { opacity: .6; }",
    /* your own answer */
    ".st-spr { display: grid; gap: 8px; justify-items: start; }",
    ".st-spr-l { font-size: 13px; font-weight: 700; color: var(--ink-2); }",
    ".st-spr-row { display: flex; align-items: center; gap: 10px; font-size: 18px; }",
    ".st-spr-in { width: 180px; height: 52px; border-radius: 14px; border: 0; box-shadow: inset 0 0 0 1.5px var(--rule); background: var(--paper); color: var(--ink); font: 600 22px/1 var(--text); padding: 0 16px; font-variant-numeric: tabular-nums; }",
    ".st-spr-in:focus { outline: none; box-shadow: inset 0 0 0 2px var(--blue); }",
    ".st-spr.yes .st-spr-in { box-shadow: inset 0 0 0 2px var(--st-good); } .st-spr.no .st-spr-in { box-shadow: inset 0 0 0 2px var(--st-low); }",
    ".st-spr-prev { min-height: 22px; font-size: 14px; color: var(--ink-2); }",
    ".st-spr-rule { margin: 0; font-size: 13px; color: var(--st-low); min-height: 0; }",
    ".st-spr-help { margin: 0; font-size: 12.5px; color: var(--ink-3); }",
    /* recognition */
    ".st-recog { margin-top: 18px; padding: 16px 18px; border-radius: 16px; background: var(--st-tint); }",
    ".st-recog-q { display: flex; gap: 8px; align-items: center; margin: 0 0 12px; font-size: 15px; }",
    ".st-recog-q .st-i { color: var(--st-teal); }",
    ".st-recog-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }",
    ".st-recog-opts.big { margin-top: 18px; }",
    ".st-recog-b { min-height: 46px; padding: 8px 14px; border-radius: 12px; border: 0; background: var(--paper); box-shadow: inset 0 0 0 1.5px var(--rule); text-align: left; font-size: 14.5px; font-weight: 550; transition: box-shadow .15s; }",
    ".st-recog-b:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px var(--st-teal); }",
    ".st-recog-b.yes { box-shadow: inset 0 0 0 2px var(--st-good); background: color-mix(in srgb, var(--st-good) 10%, var(--paper)); }",
    ".st-recog-b.no { box-shadow: inset 0 0 0 2px var(--st-low); }",
    ".st-recog-b:disabled { cursor: default; }",
    ".st-recog-say { margin: 12px 0; font-size: 14.5px; line-height: 1.5; color: var(--ink-2); }",
    ".st-recog-say.ok b { color: var(--st-good); }",
    /* lock-in */
    ".st-lock { display: none; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--hair); }",
    ".st-lock.on { display: block; animation: st-in .3s cubic-bezier(.2,.7,.2,1) both; }",
    ".st-lock.gone { display: none; }",
    ".st-lock-q { margin: 0 0 10px; font-size: 13.5px; font-weight: 700; color: var(--ink-2); }",
    ".st-conf { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }",
    ".st-conf-b { display: flex; align-items: center; justify-content: center; gap: 9px; height: 48px; border-radius: 14px; border: 0; background: var(--sunk); font-size: 14px; transition: background .15s var(--ease), transform .12s var(--ease), color .15s; }",
    ".st-conf-b .st-cbars { height: 16px; }",
    ".st-conf-b:hover { transform: translateY(-1px); }",
    ".st-conf-b.c0:hover { background: color-mix(in srgb, var(--st-low) 18%, var(--sunk)); color: var(--st-low); }",
    ".st-conf-b.c1:hover { background: color-mix(in srgb, var(--st-mid) 20%, var(--sunk)); color: var(--ink); }",
    ".st-conf-b.c2:hover { background: color-mix(in srgb, var(--st-d1) 18%, var(--sunk)); color: var(--st-d1); }",
    ".st-conf-b.c3:hover { background: color-mix(in srgb, var(--st-good) 18%, var(--sunk)); color: var(--st-good); }",
    ".st-conf-b b { font-weight: 650; }",
    ".st-skip { display: block; margin: 12px auto 0; background: none; border: 0; color: var(--ink-3); font-size: 13px; text-decoration: underline; text-underline-offset: 3px; }",
    /* the coach's replies */
    ".st-fb { display: grid; gap: 12px; margin-top: 16px; }",
    ".st-fb:empty { display: none; }",
    ".st-say { border-radius: 16px; padding: 14px 16px; background: var(--sunk); font-size: 15px; line-height: 1.55; }",
    ".st-say p { margin: 0; }",
    ".st-say-h { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }",
    ".st-say-h > span { color: var(--ink-2); }",
    ".st-say-h b { font-size: 16px; }",
    ".st-say.ok { background: color-mix(in srgb, var(--st-good) 12%, transparent); } .st-say.ok .st-say-h > .st-i { color: var(--st-good); }",
    ".st-say.no { background: color-mix(in srgb, var(--st-low) 10%, transparent); } .st-say.no .st-say-h > .st-i { color: var(--st-low); }",
    ".st-say.reveal { background: color-mix(in srgb, var(--st-d1) 10%, transparent); } .st-say.reveal .st-say-h > .st-i { color: var(--st-d1); }",
    ".st-say.retry { background: color-mix(in srgb, var(--st-mid) 14%, transparent); display: grid; gap: 10px; justify-items: start; }",
    ".st-say.ask { background: transparent; box-shadow: inset 0 0 0 1.5px var(--rule); }",
    ".st-tline { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; font-size: 12.5px; color: var(--ink-3); font-variant-numeric: tabular-nums; }",
    ".st-tline .st-i { width: 14px; height: 14px; }",
    ".st-tline.over { color: var(--ink-2); }",
    ".st-sure { margin-top: 8px !important; color: var(--ink-2); font-size: 14.5px; }",
    ".st-tempt { margin-top: 10px !important; font-size: 14.5px; color: var(--ink-2); }",
    ".st-tempt .st-lbl { display: block; }",
    ".st-ask-q { font-size: 15.5px; margin: 0 0 12px !important; }",
    ".st-errs { display: flex; flex-wrap: wrap; gap: 8px; }",
    ".st-err { height: 36px; padding: 0 14px; border-radius: 99px; border: 0; background: var(--sunk); font-size: 13.5px; font-weight: 550; transition: background .15s, box-shadow .15s; }",
    ".st-err:hover:not(:disabled) { background: var(--st-tint); }",
    ".st-err.on { background: var(--st-teal); color: #fff; }",
    "html[data-look=\"obsidian\"] .st-err.on { color: #04211d; }",
    ".st-err.ghost { background: transparent; box-shadow: inset 0 0 0 1px var(--rule); }",
    ".st-err:disabled:not(.on) { opacity: .45; cursor: default; }",
    ".st-say.rebuild { background: transparent; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--st-teal) 40%, transparent); }",
    ".st-rb-h { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; } .st-rb-h .st-i { color: var(--st-teal); }",
    ".st-rb { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }",
    ".st-rb-s, .st-mrb { padding: 12px 14px; border-radius: 14px; background: var(--sunk); }",
    ".st-rb-s.ok, .st-mrb.ok { background: color-mix(in srgb, var(--st-good) 8%, var(--sunk)); }",
    ".st-rb-q { margin: 0 0 10px !important; font-size: 15px; display: flex; gap: 10px; align-items: baseline; }",
    ".st-rb-n { flex: none; font-size: 11.5px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--st-teal); }",
    ".st-mrb .st-rb-n { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--st-tint); text-transform: none; letter-spacing: 0; }",
    ".st-rb-a { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }",
    ".st-rb-b { min-height: 38px; padding: 6px 14px; border-radius: 11px; border: 0; background: var(--paper); box-shadow: inset 0 0 0 1.5px var(--rule); font-size: 15px; transition: box-shadow .15s; }",
    ".st-rb-b:hover:not(:disabled) { box-shadow: inset 0 0 0 1.5px var(--st-teal); }",
    ".st-rb-b.yes { box-shadow: inset 0 0 0 2px var(--st-good); } .st-rb-b.no { box-shadow: inset 0 0 0 2px var(--st-low); opacity: .6; }",
    ".st-rb-b:disabled { cursor: default; }",
    ".st-rb-in { width: 110px; height: 38px; border-radius: 11px; border: 0; box-shadow: inset 0 0 0 1.5px var(--rule); background: var(--paper); color: var(--ink); font: 600 16px var(--text); padding: 0 12px; }",
    ".st-rb-in.yes { box-shadow: inset 0 0 0 2px var(--st-good); } .st-rb-in.no { box-shadow: inset 0 0 0 2px var(--st-low); animation: st-shake .35s; }",
    "@keyframes st-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }",
    ".st-rb-pre { font-size: 15px; }",
    ".st-rb-ok, .st-rb-no { display: flex; align-items: flex-start; gap: 7px; margin: 10px 0 0 !important; font-size: 14px; }",
    ".st-rb-ok { color: var(--ink-2); } .st-rb-ok .st-i { color: var(--st-good); width: 16px; height: 16px; margin-top: 2px; }",
    ".st-rb-no { color: var(--ink-2); }",
    /* the coach before answering */
    ".st-coach { display: grid; gap: 10px; margin-top: 16px; }",
    ".st-coach-rung { padding: 12px 14px; border-radius: 14px; background: var(--st-tint); font-size: 15px; line-height: 1.5; }",
    ".st-coach-rung p { margin: 0; }",
    ".st-coach-rb { display: grid; gap: 8px; }",
    ".st-coach-fin, .st-guided-h { display: flex; gap: 8px; align-items: center; margin: 4px 0 0; font-size: 14.5px; color: var(--ink-2); }",
    ".st-guided-h .st-i { color: var(--st-teal); }",
    /* layers */
    ".st-layers { border-radius: 16px; box-shadow: inset 0 0 0 1.5px var(--rule); padding: 6px; }",
    ".st-layers.folded { box-shadow: none; padding: 0; }",
    ".st-layers.folded .st-lay-tabs, .st-layers.folded .st-lay-panel { display: none; }",
    ".st-lay-open { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: 99px; border: 0; background: var(--sunk); font-size: 13.5px; font-weight: 600; }",
    ".st-lay-open .st-i { width: 16px; height: 16px; }",
    ".st-lay-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 4px; border-radius: 12px; background: var(--sunk); }",
    ".st-lay-tab { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 34px; border-radius: 9px; border: 0; background: transparent; font-size: 13.5px; font-weight: 600; color: var(--ink-2); transition: background .15s, color .15s; }",
    ".st-lay-tab.on { background: var(--paper); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.12); }",
    ".st-lay-n { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; font-size: 10.5px; background: color-mix(in srgb, var(--ink) 10%, transparent); }",
    ".st-lay-tab.on .st-lay-n { background: var(--st-teal); color: #fff; }",
    ".st-lay-panel { padding: 14px 14px 10px; font-size: 15px; line-height: 1.6; }",
    ".st-lay-panel p { margin: 0 0 8px; }",
    ".st-walk { list-style: none; counter-reset: w; margin: 0; padding: 0; display: grid; gap: 2px; }",
    ".st-walk li { counter-increment: w; display: grid; grid-template-columns: 26px minmax(0, auto) minmax(0, 1fr); gap: 14px; align-items: baseline; padding: 8px 4px; border-bottom: 1px solid var(--hair); }",
    ".st-walk li:last-child { border-bottom: 0; }",
    ".st-walk li::before { content: counter(w); font-size: 11px; font-weight: 800; color: var(--st-teal); text-align: center; }",
    ".st-walk-m { font-size: 17px; white-space: nowrap; } .st-walk-s { color: var(--ink-2); font-size: 14.5px; }",
    ".st-walk li:has(.st-walk-m) .st-walk-s:only-child { grid-column: 2 / 4; }",
    ".st-concept-line { margin: 8px 0 0; font-size: 14.5px; color: var(--ink-2); }",
    ".st-school { display: flex; gap: 8px; align-items: flex-start; margin-top: 10px !important; padding: 10px 12px; border-radius: 12px; background: var(--sunk); font-size: 13.5px; color: var(--ink-2); }",
    ".st-school .st-i { color: var(--st-teal); margin-top: 1px; }",
    /* autopsy */
    ".st-autopsy { border-radius: 18px; padding: 16px 18px; background: color-mix(in srgb, var(--st-d2) 8%, var(--paper)); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--st-d2) 26%, transparent); }",
    ".st-ap-h { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-bottom: 12px; }",
    ".st-ap-h .st-i { color: var(--st-d2); width: 22px; height: 22px; }",
    ".st-ap-h b { font-size: 16px; } .st-ap-h span { font-size: 13px; color: var(--ink-3); }",
    ".st-ap { margin: 0; display: grid; gap: 1px; }",
    ".st-ap > div { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 14px; padding: 8px 0; border-top: 1px solid color-mix(in srgb, var(--st-d2) 16%, transparent); }",
    ".st-ap dt { font-size: 13px; font-weight: 700; color: var(--ink-2); } .st-ap dd { margin: 0; font-size: 14.5px; line-height: 1.5; }",
    ".st-spot { margin-top: 12px; }",
    ".st-spot-h { margin: 0 0 10px; font-size: 14.5px; }",
    ".st-spot-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }",
    ".st-spot-c { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 14px; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); }",
    ".st-spot-t { margin: 0; font-size: 14px; line-height: 1.45; flex: 1; }",
    ".st-spot-yn { display: flex; gap: 6px; }",
    ".st-spot-b { flex: 1; height: 32px; border-radius: 9px; border: 0; background: var(--sunk); font-size: 13px; font-weight: 600; }",
    ".st-spot-b.yes { background: var(--st-good); color: #fff; } .st-spot-b.no { background: var(--st-low); color: #fff; }",
    ".st-spot-b:disabled { cursor: default; }",
    ".st-spot-why { margin: 0; font-size: 12.5px; color: var(--ink-2); line-height: 1.45; }",
    ".st-spot-why.ok b { color: var(--st-good); }",
    /* explain back */
    ".st-say.explain { background: transparent; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--st-teal) 40%, transparent); display: grid; gap: 10px; justify-items: start; }",
    ".st-ta { width: 100%; box-sizing: border-box; border-radius: 12px; border: 0; box-shadow: inset 0 0 0 1.5px var(--rule); background: var(--paper); color: var(--ink); font: 15px/1.5 var(--text); padding: 10px 12px; resize: vertical; }",
    ".st-ta:focus { outline: none; box-shadow: inset 0 0 0 2px var(--st-teal); }",
    ".st-model { width: 100%; padding: 12px 14px; border-radius: 12px; background: var(--sunk); }",
    ".st-rate { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; } .st-rate p { margin: 0 8px 0 0; font-weight: 600; }",
    ".st-rated { color: var(--ink-2); }",
    ".st-next { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; margin-top: 4px; }",
    "@media (max-width: 760px) { .st-q { padding: 18px 18px 22px; } .st-conf { grid-template-columns: 1fr 1fr; } .st-ap > div { grid-template-columns: 1fr; gap: 2px; } .st-spot-list { grid-template-columns: 1fr; } }"
  ]);

  /* ---------------------------------------------------------- Sessions */
  css([
    ".st-ptop { display: flex; align-items: center; gap: 16px; min-height: 44px; flex-wrap: wrap; }",
    ".st-back { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px 0 10px; border-radius: 99px; border: 0; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); font-size: 13.5px; font-weight: 600; color: var(--ink-2); }",
    ".st-back:hover { color: var(--ink); }",
    ".st-back .st-i { width: 16px; height: 16px; }",
    ".st-ptitle { font-family: var(--font); font-size: 17px; font-weight: 650; }",
    ".st-sess-t { display: grid; gap: 1px; } .st-sess-t b { font-family: var(--font); font-size: 18px; font-weight: 650; letter-spacing: -.01em; }",
    ".st-sess-clock { margin-left: auto; display: flex; align-items: baseline; gap: 6px; font-variant-numeric: tabular-nums; }",
    ".st-sess-clock b { font-size: 20px; font-family: var(--font); } .st-sess-clock span { font-size: 12.5px; color: var(--ink-3); }",
    ".st-sess-g { list-style: none; margin: 0; padding: 0; display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }",
    ".st-sess-g li { flex: 1 1 0; min-width: 120px; display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-radius: 14px; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); opacity: .6; transition: opacity .2s, box-shadow .2s; }",
    ".st-sess-g li.cur { opacity: 1; box-shadow: 0 0 0 2px var(--st-teal); }",
    ".st-sess-g li.done { opacity: 1; }",
    ".st-g-dot { flex: none; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--sunk); font-size: 11px; font-weight: 800; }",
    ".st-sess-g li.cur .st-g-dot { background: var(--st-teal); color: #fff; }",
    ".st-sess-g li.done .st-g-dot { background: var(--st-good); color: #fff; font-size: 0; }",
    ".st-sess-g li.done .st-g-dot::after { content: \"✓\"; font-size: 12px; }",
    ".st-g-t { display: grid; min-width: 0; } .st-g-t b { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .st-g-t i { font-style: normal; font-size: 11px; color: var(--ink-3); }",
    ".st-sess-goal { display: flex; align-items: center; gap: 8px; margin: 0 auto; font-size: 14px; color: var(--ink-2); }",
    ".st-sess-goal .st-i { color: var(--st-teal); }",
    ".st-sess-stage { display: grid; gap: 12px; min-height: 300px; }",
    ".st-blabel { display: flex; align-items: center; gap: 8px; max-width: 760px; width: 100%; margin: 6px auto -2px; font-size: 13px; font-weight: 700; color: var(--ink-2); }",
    ".st-blabel .st-i { width: 16px; height: 16px; color: var(--st-teal); }",
    ".st-blabel.mask .st-i { color: var(--st-d2); }",
    ".st-lessonhost { max-width: 760px; width: 100%; margin: 0 auto; }",
    ".st-lessonhost .ch { padding-top: 0; }",
    ".st-sum { max-width: 680px; width: 100%; margin: 10px auto; text-align: center; padding: 30px 30px 26px; }",
    ".st-sum-mark { width: 64px; height: 64px; margin: 0 auto 12px; border-radius: 50%; display: grid; place-items: center; background: var(--st-tint); color: var(--st-teal); }",
    ".st-sum-mark .st-i { width: 30px; height: 30px; }",
    ".st-sum h2 { font-family: var(--font); font-size: 30px; font-weight: 700; letter-spacing: -.02em; margin: 0 0 6px; }",
    ".st-sum-line { margin: 0 0 18px; color: var(--ink-2); font-size: 15px; }",
    ".st-sum-skills { display: grid; gap: 8px; text-align: left; }",
    ".st-sum-sk { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 16px; align-items: center; padding: 12px 14px; border-radius: 14px; background: var(--sunk); }",
    ".st-sum-n b { display: block; font-size: 14.5px; } .st-sum-n span { font-size: 12px; color: var(--ink-3); }",
    ".st-sum-u { display: flex; align-items: center; gap: 8px; font-variant-numeric: tabular-nums; } .st-sum-u .st-i { width: 14px; height: 14px; color: var(--ink-3); }",
    ".st-sum-from { color: var(--ink-3); font-size: 14px; } .st-sum-to { font-size: 20px; font-family: var(--font); }",
    ".st-sum-stage { grid-column: 1 / -1; display: flex; align-items: center; gap: 7px; margin: 0; font-size: 13px; color: var(--ink-2); }",
    ".st-sum-stage .st-i { width: 15px; height: 15px; color: var(--st-teal); }",
    ".st-sum .st-acts { justify-content: center; }",
    /* scan */
    ".st-scanbar { display: flex; gap: 3px; }",
    ".st-scanbar i { flex: 1; height: 6px; border-radius: 3px; background: var(--sunk); transition: background .3s; }",
    ".st-scanbar i.done.d1 { background: var(--st-d1); } .st-scanbar i.done.d2 { background: var(--st-d2); } .st-scanbar i.done.d3 { background: var(--st-d3); } .st-scanbar i.done.d4 { background: var(--st-d4); }",
    ".st-scanbar i.cur { background: var(--ink-3); }",
    ".st-scan-note { display: flex; gap: 8px; align-items: flex-start; max-width: 760px; width: 100%; margin: 0 auto; padding: 10px 14px; border-radius: 14px; background: var(--st-tint); font-size: 13.5px; color: var(--ink-2); box-sizing: border-box; }",
    ".st-scan-note .st-i { color: var(--st-teal); }",
    ".st-scan-intro { max-width: 760px; width: 100%; margin: 10px auto; text-align: center; padding: 36px 36px 30px; box-sizing: border-box; }",
    ".st-scan-intro h1 { font-family: var(--font); font-size: 36px; font-weight: 700; letter-spacing: -.02em; margin: 6px 0 10px; }",
    ".st-scan-intro .st-lede { margin: 0 auto; }",
    ".st-scan-art { width: 76px; height: 76px; margin: 0 auto; border-radius: 24px; display: grid; place-items: center; color: var(--st-teal);",
    "  background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--st-teal) 30%, transparent), color-mix(in srgb, var(--st-teal) 8%, transparent)); }",
    ".st-scan-art .st-i { width: 38px; height: 38px; }",
    ".st-scan-how { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 26px 0 6px; text-align: left; }",
    ".st-scan-how > div { padding: 16px; border-radius: 16px; background: var(--sunk); }",
    ".st-scan-how b { display: block; font-size: 15px; margin: 6px 0 4px; } .st-scan-how p { margin: 0; font-size: 13px; color: var(--ink-2); line-height: 1.5; }",
    ".st-scan-how .st-cbars { margin: 0 3px 0 6px; color: var(--st-teal); }",
    ".st-hn { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--st-teal); color: #fff; font-weight: 800; font-size: 13px; }",
    "html[data-look=\"obsidian\"] .st-hn { color: #04211d; }",
    /* reveal and page heads */
    ".st-rv-h { padding: 6px 2px 4px; }",
    ".st-rv-h h1, .st-sk-h h1 { font-family: var(--font); font-size: 40px; font-weight: 700; letter-spacing: -.025em; margin: 6px 0 8px; line-height: 1.08; }",
    ".st-rv-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: center; }",
    ".st-rv-stat { padding: 14px 16px; border-radius: 16px; background: var(--sunk); display: grid; gap: 2px; }",
    ".st-rv-stat b { font-family: var(--font); font-size: 34px; font-weight: 700; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }",
    ".st-rv-stat b i { font-style: normal; font-size: 18px; color: var(--ink-3); }",
    ".st-rv-stat span { font-size: 13px; color: var(--ink-3); }"
  ]);

  /* ------------------------------------------------ Module and results */
  css([
    ".st-mod { gap: 14px; }",
    ".st-mod-intro { max-width: 700px; width: 100%; margin: 20px auto; text-align: center; padding: 34px; box-sizing: border-box; }",
    ".st-mod-intro h2 { font-family: var(--font); font-size: 28px; font-weight: 700; letter-spacing: -.02em; margin: 10px 0 8px; }",
    ".st-mod-intro .st-lede { margin: 0 auto 18px; }",
    ".st-mod-ic { width: 64px; height: 64px; border-radius: 20px; margin: 0 auto; display: grid; place-items: center; background: var(--st-tint); color: var(--st-teal); } .st-mod-ic .st-i { width: 30px; height: 30px; }",
    ".st-mod-rules { list-style: none; padding: 0; margin: 0 0 22px; display: grid; gap: 10px; text-align: left; }",
    ".st-mod-rules li { display: flex; gap: 10px; align-items: flex-start; font-size: 14.5px; color: var(--ink-2); line-height: 1.5; padding: 10px 14px; border-radius: 14px; background: var(--sunk); }",
    ".st-mod-rules .st-i { color: var(--st-teal); margin-top: 2px; } .st-mod-rules b { color: var(--ink); }",
    ".st-mod-top { position: sticky; top: calc(var(--bar) + 6px); z-index: 5; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 18px; background: color-mix(in srgb, var(--paper) 92%, transparent); backdrop-filter: blur(14px); box-shadow: 0 0 0 1px var(--hair); }",
    ".st-mod-name b { display: block; font-size: 15px; } .st-mod-name span { font-size: 12px; color: var(--ink-3); }",
    ".st-mod-timer { height: 38px; padding: 0 18px; border-radius: 99px; border: 0; background: var(--sunk); font-variant-numeric: tabular-nums; }",
    ".st-mod-timer b { font-size: 18px; font-family: var(--font); }",
    ".st-mod-timer.low b { color: var(--st-low); }",
    ".st-mod-timer.off b { visibility: hidden; } .st-mod-timer.off::after { content: \"Show timer\"; font-size: 13px; font-weight: 600; margin-left: -40px; }",
    ".st-mod-tools { display: flex; gap: 6px; justify-content: flex-end; }",
    ".st-mod-stage { padding-bottom: 90px; }",
    ".st-mod-foot { position: fixed; left: 50%; transform: translateX(-50%); bottom: 16px; z-index: 20; width: min(760px, calc(100vw - 32px)); display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px 10px 16px; border-radius: 20px; background: color-mix(in srgb, var(--paper) 94%, transparent); backdrop-filter: blur(16px); box-shadow: 0 0 0 1px var(--rule), 0 18px 40px rgba(0,0,0,.25); box-sizing: border-box; }",
    ".st-mod-mapb { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: 99px; border: 0; background: var(--sunk); font-size: 14px; font-weight: 600; }",
    ".st-mod-mapb .st-i { width: 15px; height: 15px; }",
    ".st-mod-nav { display: flex; gap: 8px; }",
    ".st-mod-map { position: fixed; left: 50%; transform: translateX(-50%); bottom: 84px; z-index: 21; width: min(560px, calc(100vw - 32px)); padding: 16px 18px; border-radius: 20px; background: var(--paper); box-shadow: 0 0 0 1px var(--rule), 0 24px 60px rgba(0,0,0,.35); box-sizing: border-box; display: grid; gap: 12px; justify-items: center; }",
    ".st-mod-map[hidden] { display: none; }",
    ".st-mod-map-h { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-3); }",
    ".st-mod-map-h b { font-size: 14px; color: var(--ink); } .st-mod-map-h span { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: center; }",
    ".st-mod-map-h i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: -2px; margin-right: 3px; } .st-mod-map-h i.k-cur { box-shadow: inset 0 0 0 2px var(--blue); } .st-mod-map-h i.k-ans { background: var(--blue); } .st-mod-map-h i.k-un { box-shadow: inset 0 0 0 1.5px var(--rule); }",
    ".st-mod-map-h .st-i { width: 13px; height: 13px; color: var(--st-mid); }",
    ".st-mod-grid { display: grid; grid-template-columns: repeat(11, 36px); gap: 8px; justify-content: center; }",
    ".st-mod-grid.big { grid-template-columns: repeat(11, 44px); margin: 18px 0 6px; }",
    ".st-mod-q { position: relative; height: 36px; border-radius: 9px; border: 0; background: transparent; box-shadow: inset 0 0 0 1.5px var(--rule); font-size: 13px; font-weight: 700; color: var(--ink-2); }",
    ".st-mod-grid.big .st-mod-q { height: 44px; }",
    ".st-mod-q.ans { background: var(--blue); color: #fff; box-shadow: none; }",
    "html[data-look=\"obsidian\"] .st-mod-q.ans { background: var(--fill, #0071e3); }",
    ".st-mod-q.cur { box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--blue); }",
    ".st-mod-q.flag::after { content: \"\"; position: absolute; top: -4px; right: -4px; width: 11px; height: 11px; border-radius: 50%; background: var(--st-mid); box-shadow: 0 0 0 2px var(--paper); }",
    ".st-mod-review { max-width: 760px; width: 100%; margin: 0 auto; text-align: center; box-sizing: border-box; }",
    ".st-mod-review h2 { font-family: var(--font); font-size: 26px; margin: 0 0 8px; }",
    ".st-mod-review .st-lede { margin: 0 auto; }",
    ".st-mod-review .st-acts { justify-content: center; }",
    ".st-toast { position: fixed; top: calc(var(--bar) + 20px); left: 50%; transform: translateX(-50%); z-index: 60; padding: 12px 18px; border-radius: 14px; background: var(--ink); color: var(--paper); font: 600 14px var(--text); box-shadow: 0 16px 40px rgba(0,0,0,.3); animation: st-in .3s both; transition: opacity .5s, transform .5s; }",
    ".st-toast.go { opacity: 0; transform: translate(-50%, -10px); }",
    ".st-mres-h { display: flex; gap: 14px; justify-content: space-around; text-align: center; flex-wrap: wrap; }",
    ".st-mres-big { display: grid; gap: 2px; } .st-mres-big b { font-family: var(--font); font-size: 52px; font-weight: 700; letter-spacing: -.03em; font-variant-numeric: tabular-nums; } .st-mres-big b i { font-style: normal; font-size: 22px; color: var(--ink-3); }",
    ".st-mres-range { font-size: 13px; color: var(--ink-3); }",
    ".st-pace-chart { margin: 4px 0 8px; } .st-pace-chart svg { width: 100%; height: auto; }",
    ".st-pace-b.ok { fill: color-mix(in srgb, var(--st-good) 80%, transparent); } .st-pace-b.no { fill: color-mix(in srgb, var(--st-low) 80%, transparent); }",
    ".st-pace-aim { stroke: var(--st-d4); stroke-width: 1.5; stroke-dasharray: 5 4; }",
    ".st-pace-key { display: flex; gap: 14px; justify-content: center; font-size: 12px; color: var(--ink-3); margin: 4px 0 0; }",
    ".st-pace-key i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 4px; vertical-align: -1px; } .st-pace-key i.ok { background: var(--st-good); } .st-pace-key i.no { background: var(--st-low); } .st-pace-key i.aim { height: 2px; background: var(--st-d4); vertical-align: 3px; }",
    ".st-pace-tips { display: grid; gap: 10px; margin-top: 10px; }",
    ".st-pace-tip { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 16px; background: var(--sunk); font-size: 14.5px; line-height: 1.5; }",
    ".st-pace-tip p { margin: 4px 0 0; color: var(--ink-2); }",
    ".st-pace-tip > .st-i { color: var(--st-teal); margin-top: 2px; }",
    ".st-pace-tip.warn > .st-i { color: var(--st-mid); } .st-pace-tip.good > .st-i { color: var(--st-good); }",
    ".st-pace-rule { padding: 8px 12px; border-radius: 10px; background: var(--paper); margin-top: 8px !important; }",
    ".st-mres-list h3 { margin: 0 0 10px; font-family: var(--font); font-size: 17px; }",
    ".st-mres-rows { display: grid; gap: 2px; }",
    ".st-mres-r { display: grid; grid-template-columns: 70px minmax(0, 1fr) 70px 56px 90px; gap: 10px; align-items: center; padding: 8px 10px; border-radius: 10px; font-size: 13.5px; }",
    ".st-mres-r:nth-child(odd) { background: var(--sunk); }",
    ".st-mres-q { font-weight: 700; color: var(--ink-2); } .st-mres-t { font-variant-numeric: tabular-nums; color: var(--ink-3); }",
    ".st-mres-d { font-size: 12px; color: var(--ink-3); }",
    ".st-mres-k { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; } .st-mres-k .st-i { width: 15px; height: 15px; }",
    ".st-mres-r.ok .st-mres-k { color: var(--st-good); } .st-mres-r.no .st-mres-k { color: var(--st-low); }"
  ]);

  /* ------------------------------------------------------ Other pages */
  css([
    ".st-traps { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }",
    ".st-traps li { display: flex; justify-content: space-between; gap: 12px; padding: 9px 12px; border-radius: 11px; background: var(--sunk); font-size: 14px; }",
    ".st-traps b { color: var(--st-low); font-variant-numeric: tabular-nums; }",
    ".st-lablist { display: grid; gap: 6px; }",
    ".st-lablist summary { display: flex; align-items: baseline; gap: 10px; cursor: pointer; list-style: none; padding: 2px 0 8px; }",
    ".st-lablist summary::-webkit-details-marker { display: none; }",
    ".st-lablist summary span { font-size: 13px; color: var(--ink-3); }",
    ".st-miss { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 10px 12px; border-radius: 14px; border: 0; background: var(--sunk); transition: background .15s; }",
    ".st-miss:hover { background: color-mix(in srgb, var(--ink) 10%, var(--paper)); }",
    ".st-miss.done { opacity: .75; }",
    ".st-miss-d { flex: none; width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; }",
    ".st-miss-d.d1 { color: var(--st-d1); background: color-mix(in srgb, var(--st-d1) 14%, transparent); } .st-miss-d.d2 { color: var(--st-d2); background: color-mix(in srgb, var(--st-d2) 14%, transparent); } .st-miss-d.d3 { color: var(--st-d3); background: color-mix(in srgb, var(--st-d3) 14%, transparent); } .st-miss-d.d4 { color: var(--st-d4); background: color-mix(in srgb, var(--st-d4) 14%, transparent); }",
    ".st-miss-t { flex: 1; min-width: 0; display: grid; } .st-miss-t b { font-size: 14.5px; } .st-miss-t span { font-size: 12.5px; color: var(--ink-3); } .st-miss-t em { font-style: normal; color: var(--ink-2); }",
    ".st-miss-tr { flex: none; max-width: 38%; font-size: 12px; color: var(--st-low); background: color-mix(in srgb, var(--st-low) 10%, transparent); padding: 4px 10px; border-radius: 99px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".st-miss > .st-i { width: 16px; height: 16px; color: var(--ink-3); }",
    ".st-libbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }",
    ".st-search { flex: 1 1 320px; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px; border-radius: 99px; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); color: var(--ink-3); }",
    ".st-search input { flex: 1; border: 0; outline: 0; background: transparent; color: var(--ink); font: 15px var(--text); }",
    ".st-search:focus-within { box-shadow: 0 0 0 2px var(--st-teal); }",
    ".st-chips { display: flex; gap: 6px; flex-wrap: wrap; }",
    ".st-chipb { height: 34px; padding: 0 14px; border-radius: 99px; border: 0; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); font-size: 13px; font-weight: 600; color: var(--ink-2); }",
    ".st-chipb.on { background: var(--ink); color: var(--paper); box-shadow: none; }",
    ".st-libgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }",
    ".st-strat { position: relative; padding: 18px 20px 16px; border-radius: 20px; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); overflow: hidden; }",
    ".st-strat::before { content: \"\"; position: absolute; left: 0; top: 0; right: 0; height: 3px; }",
    ".st-strat.d1::before { background: var(--st-d1); } .st-strat.d2::before { background: var(--st-d2); } .st-strat.d3::before { background: var(--st-d3); } .st-strat.d4::before { background: var(--st-d4); }",
    ".st-strat-d { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink-3); } .st-strat-d .st-i { width: 14px; height: 14px; }",
    ".st-strat h3 { font-family: var(--font); font-size: 18px; margin: 6px 0 6px; letter-spacing: -.01em; }",
    ".st-strat-rule { margin: 0 0 6px; font-size: 15px; line-height: 1.5; }",
    ".st-strat-when { margin: 0 0 6px; font-size: 13.5px; color: var(--ink-2); line-height: 1.5; } .st-strat-when b { color: var(--st-teal); }",
    ".st-strat-body { display: grid; gap: 10px; margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--hair); justify-items: start; }",
    ".st-strat-body[hidden] { display: none; }",
    ".st-strat-ex { margin: 0; font-size: 15px; line-height: 1.55; }",
    ".st-strat-body .st-walk { width: 100%; }",
    ".st-libnone { text-align: center; }",
    ".st-spot-hud { display: flex; gap: 20px; justify-content: center; align-items: center; font-size: 14px; color: var(--ink-3); }",
    ".st-spot-hud b { font-size: 18px; color: var(--ink); font-variant-numeric: tabular-nums; }",
    ".st-spot-hud span { display: inline-flex; align-items: center; gap: 6px; }",
    ".st-spot-score .st-i { color: var(--st-good); } .st-spot-streak .st-i { color: var(--ink-3); } .st-spot-streak.hot .st-i { color: #ff8a1f; fill: color-mix(in srgb, #ff8a1f 30%, transparent); }",
    ".st-spot-q .st-stem { font-size: 17px; }",
    ".st-spot-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-top: 12px; font-size: 14.5px; color: var(--ink-2); }",
    ".st-spot-choices b { margin-right: 8px; color: var(--ink-3); }",
    ".st-mixups { text-align: left; padding: 12px 16px; border-radius: 14px; background: var(--sunk); font-size: 14px; }",
    ".st-mixups p { margin: 0 0 6px; } .st-mixups ul { margin: 0; padding-left: 18px; } .st-mixups span { color: var(--ink-3); }",
    ".st-tform { display: grid; gap: 16px; }",
    ".st-tf { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 16px; align-items: center; }",
    ".st-tf label { font-weight: 650; font-size: 14.5px; } .st-tf label i { font-style: normal; color: var(--ink-3); font-weight: 500; }",
    ".st-tf-in { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--ink-3); }",
    ".st-tf-in input[type=number], .st-tf-in input[type=date] { height: 42px; padding: 0 14px; border-radius: 12px; border: 0; box-shadow: inset 0 0 0 1.5px var(--rule); background: var(--paper); color: var(--ink); font: 600 16px var(--text); }",
    ".st-tf-in input[type=number] { width: 110px; }",
    ".st-tf-in input[type=range] { flex: 1; accent-color: var(--st-teal); max-width: 380px; }",
    ".st-goalv { font-family: var(--font); font-size: 26px; color: var(--ink); font-variant-numeric: tabular-nums; min-width: 56px; }",
    ".st-tpath { margin-top: 12px; }",
    ".st-tpath-h { display: flex; align-items: center; gap: 8px; margin: 0 0 6px; font-size: 14px; }",
    ".st-tpath.d1 .st-tpath-h .st-i { color: var(--st-d1); } .st-tpath.d2 .st-tpath-h .st-i { color: var(--st-d2); } .st-tpath.d3 .st-tpath-h .st-i { color: var(--st-d3); } .st-tpath.d4 .st-tpath-h .st-i { color: var(--st-d4); }",
    ".st-tp-r { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border-radius: 12px; border: 0; background: var(--sunk); text-align: left; margin-bottom: 6px; }",
    ".st-tp-r > span { flex: 1; display: grid; } .st-tp-r b { font-size: 14.5px; } .st-tp-r i { font-style: normal; font-size: 12.5px; color: var(--ink-3); }",
    ".st-tp-r em { font-style: normal; font-weight: 800; color: var(--st-good); font-variant-numeric: tabular-nums; }",
    ".st-tp-r .st-i { width: 16px; height: 16px; color: var(--ink-3); }",
    ".st-schoolbox { margin-top: 12px; padding: 14px 16px; border-radius: 16px; background: var(--st-tint); display: grid; gap: 6px; justify-items: start; }",
    ".st-schoolbox p { margin: 0; display: flex; gap: 8px; align-items: flex-start; font-size: 14.5px; line-height: 1.5; } .st-schoolbox p .st-i { color: var(--st-teal); margin-top: 2px; }",
    ".st-card.st-schoolbox { margin-top: 0; }",
    ".st-sk-h { padding: 6px 2px 2px; }",
    ".st-sk-h.d1 .st-eyebrow .st-i { color: var(--st-d1); } .st-sk-h.d2 .st-eyebrow .st-i { color: var(--st-d2); } .st-sk-h.d3 .st-eyebrow .st-i { color: var(--st-d3); } .st-sk-h.d4 .st-eyebrow .st-i { color: var(--st-d4); }",
    ".st-sk-u .st-score-row { display: flex; align-items: center; gap: 12px; margin: 6px 0 8px; }",
    ".st-forms { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; } .st-forms .st-lbl { width: 100%; }",
    ".st-form { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 11px; border-radius: 99px; background: var(--sunk); font-size: 12.5px; color: var(--ink-3); }",
    ".st-form.on { background: color-mix(in srgb, var(--st-good) 14%, transparent); color: var(--ink); } .st-form .st-i { width: 13px; height: 13px; color: var(--st-good); }",
    ".st-loopl { list-style: none; margin: 12px 0; padding: 0; display: grid; gap: 4px; }",
    ".st-loopl li { display: grid; grid-template-columns: 26px 110px minmax(0, 1fr); gap: 10px; align-items: center; padding: 5px 6px; border-radius: 10px; font-size: 13.5px; color: var(--ink-3); }",
    ".st-loopl li b { color: var(--ink-2); font-weight: 600; } .st-loopl li i { font-style: normal; font-size: 12.5px; }",
    ".st-loopn { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--sunk); font-size: 11px; font-weight: 800; }",
    ".st-loopl li.on .st-loopn { background: var(--st-teal); color: #fff; } .st-loopl li.on b { color: var(--ink); } .st-loopn .st-i { width: 13px; height: 13px; }",
    ".st-loopl li.next { background: var(--st-tint); } .st-loopl li.next .st-loopn { box-shadow: inset 0 0 0 2px var(--st-teal); color: var(--st-teal); }",
    ".st-srow { display: grid; grid-template-columns: 200px minmax(0, 1fr) 18px; gap: 12px; align-items: center; width: 100%; text-align: left; padding: 10px 12px; border-radius: 12px; border: 0; background: var(--sunk); margin-bottom: 6px; font-size: 14px; }",
    ".st-srow span { color: var(--ink-2); } .st-srow .st-i { width: 16px; height: 16px; color: var(--ink-3); }",
    ".st-lrow { display: grid; grid-template-columns: 22px minmax(0, 1fr) 56px 44px 90px; gap: 10px; align-items: center; padding: 7px 8px; border-radius: 10px; font-size: 13.5px; }",
    ".st-lrow:nth-child(even) { background: var(--sunk); } .st-lrow .st-i { width: 16px; height: 16px; } .st-lrow.ok > .st-i { color: var(--st-good); } .st-lrow.no > .st-i { color: var(--st-low); }",
    ".st-lrow span:nth-child(3), .st-lrow span:nth-child(5) { color: var(--ink-3); font-variant-numeric: tabular-nums; }"
  ]);

  /* ------------------------------------------------------------ Tools */
  css([
    ".st-tool { position: fixed; z-index: 40; top: calc(var(--bar) + 14px); right: 14px; width: 380px; max-height: calc(100vh - var(--bar) - 96px); display: none; flex-direction: column; border-radius: 22px; background: var(--paper); box-shadow: 0 0 0 1px var(--rule), 0 24px 60px rgba(0,0,0,.3); color: var(--ink); font-family: var(--text); overflow: hidden; }",
    ".st-tool.on { display: flex; animation: st-in .25s both; }",
    ".st-tool-h { display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 8px 18px; font-size: 15px; }",
    ".st-tool-x { width: 32px; height: 32px; border-radius: 50%; border: 0; background: var(--sunk); display: grid; place-items: center; }",
    ".st-tool-x .st-i { width: 16px; height: 16px; }",
    ".st-tool-b { padding: 4px 16px 16px; overflow-y: auto; display: grid; gap: 10px; }",
    ".st-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 12px; background: var(--sunk); }",
    ".st-seg-b { height: 32px; border-radius: 9px; border: 0; background: transparent; font-size: 13px; font-weight: 600; color: var(--ink-2); }",
    ".st-seg-b.on { background: var(--paper); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.15); }",
    ".st-calc-p, .st-graph-p { display: grid; gap: 10px; }",
    ".st-calc-p[hidden], .st-graph-p[hidden] { display: none; }",
    ".st-calc-in { height: 46px; border-radius: 12px; border: 0; box-shadow: inset 0 0 0 1.5px var(--rule); background: var(--paper); color: var(--ink); font: 500 17px var(--text); padding: 0 14px; }",
    ".st-calc-in:focus { outline: none; box-shadow: inset 0 0 0 2px var(--st-teal); }",
    ".st-calc-out { min-height: 34px; display: flex; align-items: baseline; gap: 10px; font-size: 22px; padding: 0 4px; flex-wrap: wrap; }",
    ".st-eq { color: var(--ink-3); } .st-calc-f { font-size: 16px; color: var(--ink-2); }",
    ".st-calc-err { font-size: 13px; color: var(--ink-3); }",
    ".st-calc-keys { display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; }",
    ".st-key { height: 34px; border-radius: 9px; border: 0; background: var(--sunk); font: 600 15px var(--text); }",
    ".st-key:hover { background: color-mix(in srgb, var(--ink) 12%, var(--paper)); }",
    ".st-calc-hist { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }",
    ".st-calc-hist li { display: flex; justify-content: space-between; gap: 10px; padding: 6px 8px; border-radius: 8px; font-size: 13.5px; cursor: pointer; }",
    ".st-calc-hist li:hover { background: var(--sunk); } .st-calc-hx { color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }",
    ".st-g-eqs { display: grid; gap: 6px; }",
    ".st-g-eq { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 10px; border-radius: 11px; box-shadow: inset 0 0 0 1.5px var(--rule); }",
    ".st-g-eq:focus-within { box-shadow: inset 0 0 0 2px var(--st-teal); }",
    ".st-g-eq input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--ink); font: 500 15px var(--text); }",
    ".st-g-sw { width: 10px; height: 10px; border-radius: 50%; flex: none; }",
    ".st-g-eq.c-b .st-g-sw { background: var(--st-d1); } .st-g-eq.c-r .st-g-sw { background: var(--st-low); } .st-g-eq.c-g .st-g-sw { background: var(--st-good); }",
    ".st-g-box { border-radius: 14px; overflow: hidden; box-shadow: 0 0 0 1px var(--hair); background: var(--paper); }",
    ".st-g-box svg { display: block; width: 100%; height: auto; }",
    ".st-g-zoom { display: flex; gap: 6px; } .st-g-zoom .st-key { flex: 1; }",
    ".st-g-poi { cursor: pointer; } .st-g-poi .hit { fill: transparent; } .st-g-poi .dot { fill: var(--paper); stroke: var(--ink-2); stroke-width: 2; }",
    ".st-g-poi.hi .dot { stroke: var(--st-d4); } .st-g-poi.on .dot, .st-g-poi:hover .dot { fill: var(--ink); }",
    ".st-g-read { margin: 0; min-height: 22px; font-size: 14px; color: var(--ink-2); }",
    ".st-g-tip { margin: 0; font-size: 12.5px; color: var(--ink-3); line-height: 1.5; padding: 10px 12px; border-radius: 12px; background: var(--sunk); }",
    ".st-ref { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }",
    ".st-ref-c { display: grid; gap: 4px; justify-items: center; padding: 10px 8px; border-radius: 12px; background: var(--sunk); text-align: center; font-size: 14px; }",
    ".st-ref-svg { width: 92px; height: 70px; overflow: visible; }",
    ".st-ref-facts { margin: 8px 0 0; padding-left: 18px; font-size: 13px; color: var(--ink-2); line-height: 1.55; }"
  ]);

  /* ============================================================= Figures
     The still pictures a question stands on: a graph, a scatterplot, a
     table, a bar chart or dot plot, a triangle, parallel lines, a circle, a
     solid. Each returns a string of HTML, drawn in the classes below so it
     takes its colours from the page. A figure is drawn to scale unless it
     says otherwise, as the SAT's are. */
  var FIG = SAT.fig = {};
  function fnum(v) { return num(Math.round(v * 1000) / 1000).replace("-", "−"); }
  function tx(s) { return esc(String(s)).replace(/-/g, "−"); }
  /* Letters in a drawing set as math: italic single letters, upright words. */
  function mlabel(s) {
    return String(s).split(/(\b[a-zA-Z]\b)/).map(function (p) {
      if (/^[a-zA-Z]$/.test(p)) return '<tspan font-style="italic">' + esc(p) + "</tspan>";
      return tx(p);
    }).join("");
  }
  function Pic(w, h) {
    var out = [];
    return {
      w: w, h: h, out: out,
      add: function (s) { out.push(s); },
      line: function (x1, y1, x2, y2, cls) { out.push('<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" class="' + (cls || "st-f-ink") + '"/>'); },
      path: function (d, cls) { out.push('<path d="' + d + '" class="' + (cls || "st-f-ink") + '"/>'); },
      circle: function (x, y, r, cls) { out.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" class="' + (cls || "st-f-dot") + '"/>'); },
      text: function (x, y, s, o) {
        o = o || {};
        out.push('<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (o.a || "middle") + '" class="' + (o.cls || "st-f-t") + '"' +
          (o.rot ? ' transform="rotate(' + o.rot + " " + x.toFixed(1) + " " + y.toFixed(1) + ')"' : "") + ">" + (o.raw ? s : mlabel(s)) + "</text>");
      },
      poly: function (pts, cls) { out.push('<polygon points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") + '" class="' + (cls || "st-f-shape") + '"/>'); },
      svg: function (label, cls) {
        return '<svg class="st-fig-svg ' + (cls || "") + '" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' + esc(label || "A figure") + '">' + out.join("") + "</svg>";
      }
    };
  }
  function wrapFig(inner, o) {
    o = o || {};
    return '<figure class="st-fig' + (o.cls ? " " + o.cls : "") + '"' + (o.max ? ' style="max-width:' + o.max + 'px"' : "") + ">" + inner +
      (o.cap ? "<figcaption>" + fmt(o.cap) + "</figcaption>" : "") + (o.note ? '<p class="st-fig-note">' + esc(o.note) + "</p>" : "") + "</figure>";
  }
  function niceStep(span, target) {
    var raw = span / (target || 8), p = Math.pow(10, Math.floor(Math.log10(raw))), k = raw / p;
    return (k < 1.5 ? 1 : k < 3.5 ? 2 : k < 7.5 ? 5 : 10) * p;
  }
  function compileF(f) {
    if (typeof f === "function") return f;
    var tree = LAB.parse(String(f));
    return function (x) { try { return LAB.evalTree(tree, { x: x }); } catch (e) { return NaN; } };
  }

  /* A coordinate plane with curves, points and segments.
     o: { x: [lo, hi], y: [lo, hi], grid: 1, every: 2 (label spacing), fns: [{ f, cls: "b"|"r"|"g"|"p", dash, domain, label }],
          pts: [{ x, y, label, open, cls }], segs: [[x1, y1, x2, y2, cls]], names: ["x", "y"], w: 420, noNums } */
  FIG.graph = function (o) {
    var xr = o.x || [-10, 10], yr = o.y || [-10, 10];
    var W = o.w || 420, pad = 30, H = Math.round((W - 2 * pad) * (o.aspect || (yr[1] - yr[0]) / (xr[1] - xr[0]))) + 2 * pad;
    if (H > (o.maxH || 460)) H = o.maxH || 460;
    function X(v) { return pad + (v - xr[0]) / (xr[1] - xr[0]) * (W - 2 * pad); }
    function Y(v) { return H - pad - (v - yr[0]) / (yr[1] - yr[0]) * (H - 2 * pad); }
    var P = Pic(W, H), g = o.grid || 1, ev = o.every || (xr[1] - xr[0] > 16 ? 2 : 1), evy = o.everyY || (yr[1] - yr[0] > 16 ? 2 : 1);
    for (var gx = Math.ceil(xr[0] / g) * g; gx <= xr[1] + 1e-9; gx += g) P.line(X(gx), Y(yr[0]), X(gx), Y(yr[1]), "st-f-grid");
    for (var gy = Math.ceil(yr[0] / g) * g; gy <= yr[1] + 1e-9; gy += g) P.line(X(xr[0]), Y(gy), X(xr[1]), Y(gy), "st-f-grid");
    var ax = yr[0] <= 0 && yr[1] >= 0 ? Y(0) : Y(yr[0]), ay = xr[0] <= 0 && xr[1] >= 0 ? X(0) : X(xr[0]);
    P.line(X(xr[0]) - 6, ax, X(xr[1]) + 8, ax, "st-f-axis");
    P.line(ay, Y(yr[0]) + 6, ay, Y(yr[1]) - 8, "st-f-axis");
    P.path("M" + (X(xr[1]) + 8) + " " + ax + "l-6 -4v8z", "st-f-arrow");
    P.path("M" + ay + " " + (Y(yr[1]) - 8) + "l-4 6h8z", "st-f-arrow");
    if (!o.noNums) {
      for (var lx = Math.ceil(xr[0] / ev) * ev; lx <= xr[1] + 1e-9; lx += ev) if (Math.abs(lx) > 1e-9 || !(yr[0] <= 0 && yr[1] >= 0)) P.text(X(lx), clamp(ax + 15, 12, H - 3), fnum(lx), { cls: "st-f-n" });
      for (var ly = Math.ceil(yr[0] / evy) * evy; ly <= yr[1] + 1e-9; ly += evy) if (Math.abs(ly) > 1e-9 || !(xr[0] <= 0 && xr[1] >= 0)) P.text(clamp(ay - 6, 14, W - 4), Y(ly) + 4, fnum(ly), { cls: "st-f-n", a: "end" });
      if (xr[0] <= 0 && xr[1] >= 0 && yr[0] <= 0 && yr[1] >= 0) P.text(ay - 6, ax + 15, "0", { cls: "st-f-n", a: "end" });
    }
    var nm = o.names || ["x", "y"];
    P.text(X(xr[1]) + 6, ax - 8, nm[0], { cls: "st-f-name", a: "end" });
    P.text(ay + 9, Y(yr[1]) - 2, nm[1], { cls: "st-f-name", a: "start" });
    var clipId = "stc" + Math.random().toString(36).slice(2, 8);
    P.add('<defs><clipPath id="' + clipId + '"><rect x="' + X(xr[0]) + '" y="' + Y(yr[1]) + '" width="' + (X(xr[1]) - X(xr[0])) + '" height="' + (Y(yr[0]) - Y(yr[1])) + '"/></clipPath></defs>');
    var body = [];
    (o.fns || []).forEach(function (fo) {
      var f = compileF(fo.f), a = fo.domain ? Math.max(fo.domain[0], xr[0]) : xr[0], b = fo.domain ? Math.min(fo.domain[1], xr[1]) : xr[1];
      var d = "", pen = false, prev = null, n = 360;
      for (var i = 0; i <= n; i++) {
        var x = a + (b - a) * i / n, y = f(x);
        if (!isFinite(y) || (prev != null && Math.abs(y - prev) > (yr[1] - yr[0]) * 3)) { pen = false; prev = isFinite(y) ? y : null; continue; }
        d += (pen ? "L" : "M") + X(x).toFixed(1) + " " + clamp(Y(y), -3000, 3000).toFixed(1);
        pen = true; prev = y;
      }
      body.push('<path d="' + d + '" class="st-f-curve c-' + (fo.cls || "b") + (fo.dash ? " dash" : "") + '"/>');
      if (fo.shade) {
        var poly = "", edge = fo.shade === "above" ? Y(yr[1]) - 4 : Y(yr[0]) + 4;
        for (var k2 = 0; k2 <= 120; k2++) { var xx = xr[0] + (xr[1] - xr[0]) * k2 / 120; poly += (k2 ? "L" : "M") + X(xx).toFixed(1) + " " + clamp(Y(f(xx)), -3000, 3000).toFixed(1); }
        poly += "L" + X(xr[1]) + " " + edge + "L" + X(xr[0]) + " " + edge + "Z";
        body.unshift('<path d="' + poly + '" class="st-f-shade c-' + (fo.cls || "b") + '"/>');
      }
      if (fo.label) {
        var lx2 = fo.labelAt != null ? fo.labelAt : b - (b - a) * 0.1, ly2 = f(lx2);
        if (isFinite(ly2) && ly2 > yr[0] && ly2 < yr[1]) body.push('<text x="' + (X(lx2) + 6).toFixed(1) + '" y="' + (Y(ly2) - 8).toFixed(1) + '" class="st-f-lab c-' + (fo.cls || "b") + '">' + mlabel(fo.label) + "</text>");
      }
    });
    (o.segs || []).forEach(function (s) { body.push('<line x1="' + X(s[0]) + '" y1="' + Y(s[1]) + '" x2="' + X(s[2]) + '" y2="' + Y(s[3]) + '" class="st-f-curve c-' + (s[4] || "b") + (s[5] ? " dash" : "") + '"/>'); });
    P.add('<g clip-path="url(#' + clipId + ')">' + body.join("") + "</g>");
    (o.pts || []).forEach(function (p) {
      P.circle(X(p.x), Y(p.y), p.r || 4.5, "st-f-pt c-" + (p.cls || "b") + (p.open ? " open" : ""));
      if (p.label) P.text(X(p.x) + (p.dx != null ? p.dx : 8), Y(p.y) + (p.dy != null ? p.dy : -9), p.label, { a: p.dx < 0 ? "end" : "start", cls: "st-f-t sm" });
    });
    return wrapFig(P.svg(o.alt || "A graph in the xy-plane"), { cap: o.cap, max: o.max || W, note: o.note });
  };

  /* A scatterplot (or a line graph) on axes that need not start at zero.
     o: { x: [lo, hi], y: [lo, hi], xs, ys (steps), pts: [[x, y]], line: { m, b } | { f }, xl, yl (axis titles),
          join: true (a line graph), cap } */
  FIG.scatter = function (o) {
    var W = o.w || 440, H = o.h || 300, L = 52, R = 16, T = 14, B = 44;
    var xr = o.x, yr = o.y, xs = o.xs || niceStep(xr[1] - xr[0], 6), ys = o.ys || niceStep(yr[1] - yr[0], 5);
    function X(v) { return L + (v - xr[0]) / (xr[1] - xr[0]) * (W - L - R); }
    function Y(v) { return H - B - (v - yr[0]) / (yr[1] - yr[0]) * (H - T - B); }
    var P = Pic(W, H);
    for (var gx = xr[0]; gx <= xr[1] + 1e-9; gx += xs) { P.line(X(gx), Y(yr[0]), X(gx), Y(yr[1]), "st-f-grid"); P.text(X(gx), H - B + 16, fnum(gx), { cls: "st-f-n" }); }
    for (var gy = yr[0]; gy <= yr[1] + 1e-9; gy += ys) { P.line(X(xr[0]), Y(gy), X(xr[1]), Y(gy), "st-f-grid"); P.text(L - 7, Y(gy) + 4, o.yfmt ? o.yfmt(gy) : fnum(gy), { cls: "st-f-n", a: "end" }); }
    P.line(X(xr[0]), Y(yr[0]), X(xr[1]), Y(yr[0]), "st-f-axis");
    P.line(X(xr[0]), Y(yr[0]), X(xr[0]), Y(yr[1]), "st-f-axis");
    if (o.xl) P.text((L + W - R) / 2, H - 8, o.xl, { cls: "st-f-name up", raw: true });
    if (o.yl) P.text(14, (T + H - B) / 2, o.yl, { cls: "st-f-name up", rot: -90, raw: true });
    if (o.line) {
      var f = o.line.f ? compileF(o.line.f) : function (x) { return o.line.m * x + o.line.b; };
      var d = "", n = 60;
      for (var i = 0; i <= n; i++) { var x = xr[0] + (xr[1] - xr[0]) * i / n, y = f(x); if (y < yr[0] - 1e-9 || y > yr[1] + 1e-9) continue; d += (d ? "L" : "M") + X(x).toFixed(1) + " " + Y(y).toFixed(1); }
      P.path(d, "st-f-curve c-r" + (o.line.dash ? " dash" : ""));
    }
    if (o.join) P.path(o.pts.map(function (p, k) { return (k ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(""), "st-f-curve c-b");
    o.pts.forEach(function (p) { P.circle(X(p[0]), Y(p[1]), o.r || 4, "st-f-pt c-b"); });
    return wrapFig(P.svg(o.alt || "A scatterplot"), { cap: o.cap, max: W, note: o.note });
  };

  /* A table. o: { head: [..], rows: [[..]], cap, left: true (first column is a label) } */
  FIG.table = function (o) {
    var h = '<div class="st-tab-wrap"><table class="st-tab' + (o.left ? " left" : "") + '">';
    if (o.cap) h += "<caption>" + fmt(o.cap) + "</caption>";
    if (o.head) h += "<thead><tr>" + o.head.map(function (c) { return "<th>" + fmt(String(c)) + "</th>"; }).join("") + "</tr></thead>";
    h += "<tbody>" + o.rows.map(function (r) {
      return "<tr>" + r.map(function (c, i) { return (i === 0 && o.left ? "<th>" : "<td>") + fmt(String(c)) + (i === 0 && o.left ? "</th>" : "</td>"); }).join("") + "</tr>";
    }).join("") + "</tbody></table></div>";
    return h;
  };

  /* A bar chart or histogram. o: { cats: [..], vals: [..], hist: true (bars touch), y: [0, hi], ys, xl, yl, cap } */
  FIG.bars = function (o) {
    var W = o.w || 440, H = o.h || 280, L = 50, R = 12, T = 12, B = 46;
    var hi = o.y ? o.y[1] : Math.max.apply(null, o.vals) * 1.15, ys = o.ys || niceStep(hi, 5);
    hi = Math.ceil(hi / ys) * ys;
    function Y(v) { return H - B - v / hi * (H - T - B); }
    var P = Pic(W, H), n = o.vals.length, slot = (W - L - R) / n, bw = o.hist ? slot : slot * 0.62;
    for (var gy = 0; gy <= hi + 1e-9; gy += ys) { P.line(L, Y(gy), W - R, Y(gy), "st-f-grid"); P.text(L - 7, Y(gy) + 4, fnum(gy), { cls: "st-f-n", a: "end" }); }
    o.vals.forEach(function (v, i) {
      var x = L + i * slot + (slot - bw) / 2;
      P.add('<rect x="' + x.toFixed(1) + '" y="' + Y(v).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Y(0) - Y(v)).toFixed(1) + '" class="st-f-bar' + (o.hi === i ? " hi" : "") + '"/>');
      if (!o.hist || o.cats) P.text(L + i * slot + slot / 2, H - B + 16, o.cats ? o.cats[i] : "", { cls: "st-f-n", raw: false });
    });
    if (o.hist && o.edges) o.edges.forEach(function (e, i) { P.text(L + i * slot, H - B + 16, fnum(e), { cls: "st-f-n" }); });
    P.line(L, Y(0), W - R, Y(0), "st-f-axis");
    P.line(L, Y(0), L, T, "st-f-axis");
    if (o.xl) P.text((L + W - R) / 2, H - 8, o.xl, { cls: "st-f-name up", raw: true });
    if (o.yl) P.text(14, (T + H - B) / 2, o.yl, { cls: "st-f-name up", rot: -90, raw: true });
    return wrapFig(P.svg(o.alt || "A bar chart"), { cap: o.cap, max: W });
  };

  /* A dot plot: one dot per value, stacked. o: { vals: [..], x: [lo, hi], xl, cap } */
  FIG.dots = function (o) {
    var W = o.w || 440, lo = o.x[0], hi = o.x[1], L = 24, R = 24, n = hi - lo;
    var counts = {}, top = 0;
    o.vals.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; top = Math.max(top, counts[v]); });
    var H = 58 + top * 17, base = H - 38;
    function X(v) { return L + (v - lo) / n * (W - L - R); }
    var P = Pic(W, H);
    P.line(L - 8, base, W - R + 8, base, "st-f-axis");
    for (var v = lo; v <= hi; v++) { P.line(X(v), base, X(v), base + 5, "st-f-axis"); P.text(X(v), base + 19, fnum(v), { cls: "st-f-n" }); }
    Object.keys(counts).forEach(function (k) { for (var i = 0; i < counts[k]; i++) P.circle(X(+k), base - 10 - i * 17, 6.5, "st-f-pt c-b"); });
    if (o.xl) P.text(W / 2, H - 2, o.xl, { cls: "st-f-name up", raw: true });
    return wrapFig(P.svg(o.alt || "A dot plot"), { cap: o.cap, max: W });
  };

  /* A figure from points: polygons, segments, labels, angle arcs, right-angle
     marks, tick marks for equal sides. Coordinates in any units; the drawing
     is fitted into the box.
     o: { pts: { A: [x, y], … }, polys: [["A","B","C"]], segs: [["A","B", cls?]], lines: [["P","Q"]] (extended),
          labels: { A: "A" | { t, dx, dy } }, sides: [["A","B","10"]], angles: [["A","B","C","40°"]], right: [["A","B","C"]],
          ticks: [["A","B",1]], w, h, noScale } */
  FIG.shape = function (o) {
    var W = o.w || 380, H = o.h || 260, pad = o.pad || 34;
    var ks = Object.keys(o.pts), xs = ks.map(function (k) { return o.pts[k][0]; }), ys = ks.map(function (k) { return o.pts[k][1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var sc = Math.min((W - 2 * pad) / ((x1 - x0) || 1), (H - 2 * pad) / ((y1 - y0) || 1));
    var ox = (W - (x1 - x0) * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
    function p(k) { var q = o.pts[k]; return [ox + (q[0] - x0) * sc, H - oy - (q[1] - y0) * sc]; }
    var P = Pic(W, H);
    (o.fill || []).forEach(function (f) { P.poly(f.pts.map(p), "st-f-fill c-" + (f.cls || "b")); });
    (o.polys || []).forEach(function (pl) { P.poly(pl.map(p), "st-f-shape"); });
    (o.lines || []).forEach(function (ln) {
      var a = p(ln[0]), b = p(ln[1]), dx = b[0] - a[0], dy = b[1] - a[1], L2 = Math.sqrt(dx * dx + dy * dy) || 1, e = ln[2] || 40;
      P.line(a[0] - dx / L2 * e, a[1] - dy / L2 * e, b[0] + dx / L2 * e, b[1] + dy / L2 * e, "st-f-ink");
    });
    (o.segs || []).forEach(function (s) { var a = p(s[0]), b = p(s[1]); P.line(a[0], a[1], b[0], b[1], s[2] ? "st-f-ink c-" + s[2] : "st-f-ink"); });
    (o.right || []).forEach(function (r) {
      var a = p(r[0]), b = p(r[1]), c = p(r[2]), s = 11;
      function u(q) { var dx = q[0] - b[0], dy = q[1] - b[1], l = Math.sqrt(dx * dx + dy * dy) || 1; return [dx / l, dy / l]; }
      var ua = u(a), uc = u(c);
      P.path("M" + (b[0] + ua[0] * s) + " " + (b[1] + ua[1] * s) + "L" + (b[0] + (ua[0] + uc[0]) * s) + " " + (b[1] + (ua[1] + uc[1]) * s) + "L" + (b[0] + uc[0] * s) + " " + (b[1] + uc[1] * s), "st-f-thin");
    });
    (o.angles || []).forEach(function (r) {
      var a = p(r[0]), b = p(r[1]), c = p(r[2]), rad = r[4] || 22;
      var t1 = Math.atan2(a[1] - b[1], a[0] - b[0]), t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
      var d = t2 - t1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      var sx = b[0] + rad * Math.cos(t1), sy = b[1] + rad * Math.sin(t1), ex = b[0] + rad * Math.cos(t1 + d), ey = b[1] + rad * Math.sin(t1 + d);
      P.path("M" + sx.toFixed(1) + " " + sy.toFixed(1) + "A" + rad + " " + rad + " 0 0 " + (d > 0 ? 1 : 0) + " " + ex.toFixed(1) + " " + ey.toFixed(1), "st-f-thin c-o");
      var mid = t1 + d / 2, lr = rad + 13;
      if (r[3]) P.text(b[0] + lr * Math.cos(mid), b[1] + lr * Math.sin(mid) + 4, r[3], { cls: "st-f-t sm c-o" });
    });
    (o.ticks || []).forEach(function (t) {
      var a = p(t[0]), b = p(t[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / l, ny = dx / l, n = t[2] || 1;
      for (var i = 0; i < n; i++) { var off = (i - (n - 1) / 2) * 5; P.line(mx + dx / l * off - nx * 6, my + dy / l * off - ny * 6, mx + dx / l * off + nx * 6, my + dy / l * off + ny * 6, "st-f-thin"); }
    });
    (o.sides || []).forEach(function (s) {
      var a = p(s[0]), b = p(s[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = dy / l, ny = -dx / l;
      // Put the label on the side away from the figure's middle.
      var cx = ks.reduce(function (acc, k) { return acc + p(k)[0]; }, 0) / ks.length, cy = ks.reduce(function (acc, k) { return acc + p(k)[1]; }, 0) / ks.length;
      if ((mx + nx * 10 - cx) * nx + (my + ny * 10 - cy) * ny < 0) { nx = -nx; ny = -ny; }
      P.text(mx + nx * (s[3] || 15), my + ny * (s[3] || 15) + 4, s[2], { cls: "st-f-t sm" });
    });
    (o.dots || []).forEach(function (k) { var q = p(k); P.circle(q[0], q[1], 3.2, "st-f-pt c-ink"); });
    var labels = o.labels || {};
    Object.keys(labels).forEach(function (k) {
      var q = p(k), L = labels[k], t = typeof L === "string" ? L : L.t;
      var cx = ks.reduce(function (acc, kk) { return acc + p(kk)[0]; }, 0) / ks.length, cy = ks.reduce(function (acc, kk) { return acc + p(kk)[1]; }, 0) / ks.length;
      var dx = L.dx != null ? L.dx : (q[0] - cx), dy = L.dy != null ? L.dy : (q[1] - cy), l = Math.sqrt(dx * dx + dy * dy) || 1;
      var k2 = L.dx != null ? 1 : 15 / l;
      P.text(q[0] + dx * k2, q[1] + dy * k2 + 5, t, { cls: "st-f-t" });
    });
    return wrapFig(P.svg(o.alt || "A figure"), { max: W, note: o.noScale ? "Note: Figure not drawn to scale." : null, cap: o.cap });
  };

  /* A circle: centre, radius, points on it, a sector, chords.
     o: { r (world), c: "O", pts: { A: deg, … }, radii: ["A"], chords: [["A","B"]], sector: ["A","B"] (counter-clockwise from A),
          label: { r: "6" }, angle: ["A","B","60°"], w } */
  FIG.circle = function (o) {
    var W = o.w || 280, H = o.h || 260, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 34;
    function at(deg) { var t = deg * Math.PI / 180; return [cx + R * Math.cos(t), cy - R * Math.sin(t)]; }
    var P = Pic(W, H);
    if (o.sector) {
      var a1 = o.pts[o.sector[0]], a2 = o.pts[o.sector[1]], s = at(a1), e = at(a2), sweep = ((a2 - a1) % 360 + 360) % 360;
      P.path("M" + cx + " " + cy + "L" + s[0].toFixed(1) + " " + s[1].toFixed(1) + "A" + R + " " + R + " 0 " + (sweep > 180 ? 1 : 0) + " 0 " + e[0].toFixed(1) + " " + e[1].toFixed(1) + "Z", "st-f-fill c-b");
    }
    P.circle(cx, cy, R, "st-f-ring");
    P.circle(cx, cy, 3.2, "st-f-pt c-ink");
    if (o.c) P.text(cx + 2, cy + 18, o.c, { cls: "st-f-t" });
    (o.radii || []).forEach(function (k) { var q = at(o.pts[k]); P.line(cx, cy, q[0], q[1], "st-f-ink"); });
    (o.chords || []).forEach(function (ch) { var a = at(o.pts[ch[0]]), b = at(o.pts[ch[1]]); P.line(a[0], a[1], b[0], b[1], "st-f-ink"); });
    Object.keys(o.pts || {}).forEach(function (k) {
      var q = at(o.pts[k]), t = o.pts[k] * Math.PI / 180;
      P.circle(q[0], q[1], 3.2, "st-f-pt c-ink");
      P.text(cx + (R + 16) * Math.cos(t), cy - (R + 16) * Math.sin(t) + 5, k, { cls: "st-f-t" });
    });
    if (o.label && o.label.r && o.radii && o.radii.length) {
      var q2 = at(o.pts[o.radii[0]]), t2 = o.pts[o.radii[0]] * Math.PI / 180;
      // On the radius, on the side away from the sector and its angle mark.
      P.text(cx + (q2[0] - cx) * 0.62 + 13 * Math.sin(t2), cy + (q2[1] - cy) * 0.62 + 13 * Math.cos(t2) + 4, o.label.r, { cls: "st-f-t sm" });
    }
    // A tangent at a point of the circle, out to an outside point, with the
    // right angle it makes with the radius.
    if (o.tangent) {
      var ta = o.pts[o.tangent.at] * Math.PI / 180, A0 = at(o.pts[o.tangent.at]);
      var dir = o.tangent.cw ? [Math.sin(ta), Math.cos(ta)] : [-Math.sin(ta), -Math.cos(ta)], Lt = o.tangent.len || R * 1.4;
      var Pt = [A0[0] + dir[0] * Lt, A0[1] + dir[1] * Lt];
      P.line(A0[0] - dir[0] * 18, A0[1] - dir[1] * 18, Pt[0], Pt[1], "st-f-ink");
      P.circle(Pt[0], Pt[1], 3.2, "st-f-pt c-ink");
      P.text(Pt[0] + dir[0] * 12, Pt[1] + dir[1] * 12 + 5, o.tangent.P || "P", { cls: "st-f-t" });
      var rin = [(cx - A0[0]) / R, (cy - A0[1]) / R], m = 10;
      P.path("M" + (A0[0] + rin[0] * m) + " " + (A0[1] + rin[1] * m) + "L" + (A0[0] + (rin[0] + dir[0]) * m) + " " + (A0[1] + (rin[1] + dir[1]) * m) + "L" + (A0[0] + dir[0] * m) + " " + (A0[1] + dir[1] * m), "st-f-thin");
      if (o.tangent.seg) { P.line(cx, cy, Pt[0], Pt[1], "st-f-thin dash"); }
      if (o.tangent.label) P.text((A0[0] + Pt[0]) / 2 - dir[1] * 12, (A0[1] + Pt[1]) / 2 + dir[0] * 12 + 4, o.tangent.label, { cls: "st-f-t sm" });
      if (o.tangent.dlabel) P.text((cx + Pt[0]) / 2 + dir[1] * 12, (cy + Pt[1]) / 2 - dir[0] * 12 + 4, o.tangent.dlabel, { cls: "st-f-t sm" });
    }
    if (o.angle) {
      var d1 = o.pts[o.angle[0]], d2 = o.pts[o.angle[1]], rr = 20, s1 = [cx + rr * Math.cos(d1 * Math.PI / 180), cy - rr * Math.sin(d1 * Math.PI / 180)],
          e1 = [cx + rr * Math.cos(d2 * Math.PI / 180), cy - rr * Math.sin(d2 * Math.PI / 180)], sw = ((d2 - d1) % 360 + 360) % 360, mid = (d1 + sw / 2) * Math.PI / 180;
      P.path("M" + s1[0].toFixed(1) + " " + s1[1].toFixed(1) + "A" + rr + " " + rr + " 0 " + (sw > 180 ? 1 : 0) + " 0 " + e1[0].toFixed(1) + " " + e1[1].toFixed(1), "st-f-thin c-o");
      P.text(cx + 36 * Math.cos(mid), cy - 36 * Math.sin(mid) + 4, o.angle[2], { cls: "st-f-t sm c-o" });
    }
    return wrapFig(P.svg(o.alt || "A circle"), { max: W, note: o.noScale ? "Note: Figure not drawn to scale." : null });
  };

  /* A box plot on a number line. o: { five: [min, q1, med, q3, max], x: [lo, hi], xl, step } */
  FIG.box = function (o) {
    var W = o.w || 460, H = 130, L = 26, Rr = 26, lo = o.x[0], hi = o.x[1], f = o.five, st = o.step || niceStep(hi - lo, 10);
    function X(v) { return L + (v - lo) / (hi - lo) * (W - L - Rr); }
    var P = Pic(W, H), y = 48, base = 96;
    P.line(X(lo) - 6, base, X(hi) + 6, base, "st-f-axis");
    // A small tick at every unit (every two on a long axis), so the five
    // numbers can be read off exactly; a numbered tick every step.
    var mi = o.minor || (hi - lo > 40 ? 2 : 1);
    for (var u = lo; u <= hi + 1e-9; u += mi) P.line(X(u), base, X(u), base + 3, "st-f-axis");
    for (var v = lo; v <= hi + 1e-9; v += st) { P.line(X(v), base, X(v), base + 7, "st-f-axis"); P.text(X(v), base + 20, fnum(v), { cls: "st-f-n" }); }
    P.line(X(f[0]), y, X(f[1]), y, "st-f-ink"); P.line(X(f[3]), y, X(f[4]), y, "st-f-ink");
    P.line(X(f[0]), y - 10, X(f[0]), y + 10, "st-f-ink"); P.line(X(f[4]), y - 10, X(f[4]), y + 10, "st-f-ink");
    P.add('<rect x="' + X(f[1]).toFixed(1) + '" y="' + (y - 20) + '" width="' + (X(f[3]) - X(f[1])).toFixed(1) + '" height="40" class="st-f-shape"/>');
    P.line(X(f[2]), y - 20, X(f[2]), y + 20, "st-f-ink c-b");
    if (o.xl) P.text(W / 2, H - 2, o.xl, { cls: "st-f-name up", raw: true });
    return wrapFig(P.svg(o.alt || "A box plot"), { cap: o.cap, max: W });
  };

  /* A solid, drawn in a simple oblique view: a box, a cylinder, a cone, a
     sphere. o: { kind, dims: { l, w, h, r }, labels: { l, w, h, r } } */
  FIG.solid = function (o) {
    var W = o.w || 300, H = o.h || 220, P = Pic(W, H), L = o.labels || {};
    if (o.kind === "box") {
      var bx = 60, by = 60, bw = 150, bh = 100, dx = 50, dy = -34;
      P.poly([[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]], "st-f-shape");
      P.poly([[bx, by], [bx + dx, by + dy], [bx + bw + dx, by + dy], [bx + bw, by]], "st-f-shape soft");
      P.poly([[bx + bw, by], [bx + bw + dx, by + dy], [bx + bw + dx, by + bh + dy], [bx + bw, by + bh]], "st-f-shape soft2");
      if (L.l) P.text(bx + bw / 2, by + bh + 20, L.l, { cls: "st-f-t sm" });
      if (L.h) P.text(bx - 12, by + bh / 2 + 4, L.h, { cls: "st-f-t sm", a: "end" });
      if (L.w) P.text(bx + bw + dx / 2 + 12, by + bh + dy / 2 + 12, L.w, { cls: "st-f-t sm", a: "start" });
    } else if (o.kind === "cyl" || o.kind === "cone") {
      var cx2 = W / 2, rx = 70, ry = 18, top = 40, bot = 176;
      if (o.kind === "cyl") {
        P.path("M" + (cx2 - rx) + " " + top + "V" + bot + "A" + rx + " " + ry + " 0 0 0 " + (cx2 + rx) + " " + bot + "V" + top, "st-f-shape");
        P.add('<ellipse cx="' + cx2 + '" cy="' + top + '" rx="' + rx + '" ry="' + ry + '" class="st-f-shape soft"/>');
        P.path("M" + (cx2 - rx) + " " + bot + "A" + rx + " " + ry + " 0 0 1 " + (cx2 + rx) + " " + bot, "st-f-thin dash");
      } else {
        P.path("M" + (cx2 - rx) + " " + bot + "L" + cx2 + " " + top + "L" + (cx2 + rx) + " " + bot + "A" + rx + " " + ry + " 0 0 1 " + (cx2 - rx) + " " + bot, "st-f-shape");
        P.path("M" + (cx2 - rx) + " " + bot + "A" + rx + " " + ry + " 0 0 1 " + (cx2 + rx) + " " + bot, "st-f-thin dash");
        P.line(cx2, top, cx2, bot, "st-f-thin dash");
      }
      P.line(cx2, bot, cx2 + rx, bot, "st-f-ink");
      if (L.r) P.text(cx2 + rx / 2, bot + 17, L.r, { cls: "st-f-t sm" });
      if (L.h) P.text(cx2 + rx + 12, (top + bot) / 2 + 4, L.h, { cls: "st-f-t sm", a: "start" });
    } else if (o.kind === "sphere") {
      var sc = W / 2, sy = H / 2, sr = 78;
      P.circle(sc, sy, sr, "st-f-ring");
      P.add('<ellipse cx="' + sc + '" cy="' + sy + '" rx="' + sr + '" ry="20" class="st-f-thin dash"/>');
      P.line(sc, sy, sc + sr, sy, "st-f-ink");
      P.circle(sc, sy, 3, "st-f-pt c-ink");
      if (L.r) P.text(sc + sr / 2, sy - 8, L.r, { cls: "st-f-t sm" });
    }
    return wrapFig(P.svg(o.alt || "A solid"), { max: W, note: o.noScale ? "Note: Figure not drawn to scale." : null });
  };

  /* ============================================================ Registry
     The four domains of the digital SAT's Math section, with the share of
     the test each one is, and every skill in them. A domain file
     (learn/sat/uNN.js) hands its skills to SAT.domain(), which also makes
     the domain a lab unit, so its lessons and practice have pages of their
     own. */
  var DOMAINS = SAT.DOMAINS = {
    1: { n: 1, t: "Algebra", w: 0.35, cls: "d1", glyph: I.sigma, q: "13–15 questions",
         d: "Linear equations, linear functions, systems and inequalities." },
    2: { n: 2, t: "Advanced Math", w: 0.35, cls: "d2", glyph: I.fx, q: "13–15 questions",
         d: "Equivalent expressions, quadratics, exponentials, nonlinear equations and functions." },
    3: { n: 3, t: "Problem-Solving & Data Analysis", short: "Data Analysis", w: 0.15, cls: "d3", glyph: I.chart, q: "5–7 questions",
         d: "Ratios, rates, percentages, data, probability and what a study can conclude." },
    4: { n: 4, t: "Geometry & Trigonometry", short: "Geometry & Trig", w: 0.15, cls: "d4", glyph: I.tri, q: "5–7 questions",
         d: "Area and volume, lines and angles, right triangles and trigonometry, circles." }
  };
  var SK = SAT.SK = {};        // id → skill
  var ORDER = SAT.ORDER = [];  // every skill id, in domain order
  var STRATS = SAT.STRATS = []; // the strategy library
  var LOADED = {};             // which domain files have arrived

  /* The disguises one idea can wear. "Same skill, different disguise" walks
     a student through them, so the idea is recognised however it is asked. */
  var FORMS = SAT.FORMS = {
    equation: { t: "Direct", d: "the idea asked plainly" },
    word: { t: "Word problem", d: "the same idea in a sentence" },
    graph: { t: "Graph", d: "the same idea drawn" },
    table: { t: "Table", d: "the same idea as numbers in a table" },
    model: { t: "Real-world model", d: "the same idea as a model of something real" },
    twist: { t: "SAT twist", d: "the same idea asked in an unfamiliar way" }
  };

  /* What happened, in the student's words — and the five ways points are
     lost that they add up to. */
  var ERR = SAT.ERR = {
    concept: { t: "I didn't know the concept", b: "concept" },
    misread: { t: "I misunderstood the question", b: "misread" },
    calc: { t: "I made a calculation mistake", b: "careless" },
    time: { t: "I ran out of time", b: "time" },
    guess: { t: "I guessed", b: "strategy" },
    formula: { t: "I used the wrong formula", b: "concept" },
    graph: { t: "I misread the graph or table", b: "misread" },
    two: { t: "I narrowed it down but picked the wrong one", b: "strategy" }
  };
  var ERR_ORDER = ["concept", "misread", "calc", "time", "guess", "formula", "graph", "two"];
  var BUCKETS = SAT.BUCKETS = {
    concept: { t: "Concept gaps", d: "The idea itself isn't solid yet.", fix: "Learn it, then practise it in every disguise." },
    misread: { t: "Misreading", d: "You knew it, but answered a different question than the one asked.", fix: "Underline what's being asked before you solve." },
    careless: { t: "Careless errors", d: "Right method, a slip on the way.", fix: "Estimate first, and check the answer against the question." },
    strategy: { t: "Strategy", d: "Guessing, or choosing between the last two.", fix: "Eliminate with a reason, and test the choices." },
    time: { t: "Time management", d: "Out of time, or rushed at the end.", fix: "Flag long questions and come back." }
  };
  var BUCKET_ORDER = ["concept", "misread", "careless", "strategy", "time"];

  /* How sure a student said they were, from a guess to certain. */
  var CONF = SAT.CONF = [
    { k: 0, t: "Guessing", s: "No real idea" },
    { k: 1, t: "Unsure", s: "Could go either way" },
    { k: 2, t: "Pretty sure", s: "I think so" },
    { k: 3, t: "Certain", s: "I know it" }
  ];
  function confBars(k) {
    var h = '<span class="st-cbars" aria-hidden="true">';
    for (var i = 0; i < 4; i++) h += '<i class="' + (i <= k ? "on" : "") + '"></i>';
    return h + "</span>";
  }

  /* A domain file registers here. Each skill:
       { id, t, short, kind (what the question is, for recognition), blurb,
         forms: [..], school: { course, unit, t }, strategies: [ids],
         lesson: [CH steps] (the idea, before any practice),
         gen: function (R, { diff, form }) → an item (see norm below) }
     A strategy: { id, t, rule, when, skills: [ids], walk: [{ m, say }], ex } */
  SAT.domain = function (n, def) {
    var D = DOMAINS[n];
    D.ids = (def.skills || []).map(function (sk) {
      sk.domain = n;
      sk.forms = sk.forms || ["equation", "word"];
      SK[sk.id] = sk;
      return sk.id;
    });
    ORDER.length = 0;
    [1, 2, 3, 4].forEach(function (k) { (DOMAINS[k].ids || []).forEach(function (id) { ORDER.push(id); }); });
    (def.strategies || []).forEach(function (s) { s.domain = n; STRATS.push(s); });
    LOADED[n] = true;
    // The lab unit: one lesson per skill — the idea, then three questions
    // made from the skill's own generator — and the skill's practice.
    LAB.unit("sat", n, {
      title: D.t,
      lessons: def.skills.map(function (sk) {
        var steps = (sk.lesson || []).slice();
        [1, 2, 2].forEach(function (d, i) {
          var it = makeItem(sk.id, "lesson:" + sk.id + ":" + i, { diff: d, form: sk.forms[i % sk.forms.length] });
          if (it) steps.push(toStep(it, i === 0 ? "Try it" : null));
        });
        return { title: sk.t, blurb: plain(sk.blurb), mins: sk.mins || 8, steps: steps };
      }),
      skills: def.skills.map(function (sk, i) {
        return { id: sk.id, title: sk.t, lesson: i + 1,
                 gen: function (R2, j) { return toStep(makeItem(sk.id, "prac:" + R2.int(0, 1e9) + ":" + j, { diff: 1 + (j % 3) })); } };
      }),
      quizzes: []
    });
  };
  SAT.loaded = function (n) { return !!LOADED[n]; };
  /* A blurb for a page that prints plain text (the lab's unit page): the
     little math in it written out — −b/a, not \frac. */
  function plain(t) {
    return String(t || "").replace(/\$([^$]+)\$/g, function (_, m2) {
      return m2.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2").replace(/\\pm/g, "±").replace(/\\le/g, "≤").replace(/\\ge/g, "≥")
        .replace(/\\sqrt\{([^}]*)\}/g, "√$1").replace(/\^\{?(\w)\}?/g, function (_, e) { return { 2: "²", 3: "³" }[e] || "^" + e; })
        .replace(/\\[a-zA-Z]+/g, "").replace(/[{}]/g, "").replace(/-/g, "−");
    });
  }
  SAT.plain = plain;
  function skillsIn(n) { return ORDER.filter(function (id) { return SK[id].domain === n; }); }
  SAT.skillsIn = skillsIn;

  /* ============================================================= Helpers
     For the domain files: a number as math (a fraction when it is one),
     choices that carry their value so they sort, money, and the lines of a
     worked example. */
  FORMS.figure = { t: "Figure", d: "the same idea in a diagram" };
  var H = SAT.h = {};
  /* A value as TeX: an integer, a fraction with a small denominator, or a
     decimal. */
  function texOf(v) {
    if (typeof v === "string") return v;
    if (Math.abs(v - Math.round(v)) < 1e-9) return Math.abs(v) >= 10000 ? (v < 0 ? "-" : "") + H.commas(Math.abs(Math.round(v))).replace(/,/g, "\\text{,}") : String(Math.round(v));
    for (var d = 2; d <= 24; d++) {
      var n = v * d;
      if (Math.abs(n - Math.round(n)) < 1e-9) return LAB.frac(Math.round(n), d);
    }
    return num(Math.round(v * 1000) / 1000);
  }
  H.tex = texOf;
  H.n = function (v) { return "$" + texOf(v) + "$"; };
  /* A numeric choice: shown as math, sorted by value. o: { ok, err, tr, why } */
  H.c = function (v, o) { return Object.assign({ t: "$" + texOf(v) + "$", v: v }, o || {}); };
  /* A choice written in TeX, or in words. */
  H.x = function (tex, o) { return Object.assign({ t: "$" + tex + "$" }, o || {}); };
  H.w = function (text, o) { return Object.assign({ t: text }, o || {}); };
  H.commas = function (v) { var s = String(Math.round(v * 100) / 100), p = s.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); return p.join("."); };
  H.money = function (v) { var s = H.commas(v); return "\\$" + (/\.\d$/.test(s) ? s + "0" : s); };
  /* A big number inside math: the lab's typesetter spaces a comma out as a
     list separator, so the thousands comma is set as text. */
  H.bigm = function (v) { return H.commas(v).replace(/,/g, "\\text{,}"); };
  H.walk = function (rows) { return rows.map(function (r) { return { m: r[0], say: r[1] }; }); };
  H.lin = function (a, b, v) { return LAB.poly([[a, v || "x"], [b, ""]]); };
  H.signed = function (b) { return b < 0 ? "- " + Math.abs(b) : "+ " + b; };
  /* A wrong choice that is really just an arithmetic slip, for when a
     question's own traps land on the same number. */
  H.slip = function (v) { return { t: "$" + texOf(v) + "$", v: v, err: "calc", tr: "an arithmetic slip", why: "Close, but the arithmetic is off — rework the last step." }; };
  H.round = function (v, k) { var p = Math.pow(10, k || 0); return Math.round(v * p) / p; };
  H.gcd = LAB.gcd;
  /* The first n candidates that differ from the right answer and from each
     other (and pass the test, when one is given — a "wrong" point that
     happens to satisfy the equation would be a second right answer). */
  H.distinct = function (right, cands, n, test) {
    var seen = {}, out = [];
    seen[String(right.t).replace(/\s+/g, "")] = 1;
    cands.forEach(function (c) {
      if (!c || out.length >= (n || 3)) return;
      var k = String(c.t).replace(/\s+/g, "");
      if (seen[k] || (test && !test(c))) return;
      seen[k] = 1;
      out.push(c);
    });
    return out;
  };

  /* ============================================================== Record
     Everything the SAT side knows about a student, kept on the device at
     once and on the account as the progress scope "sat":

       sk     per skill: th (ability, on a logit scale), n and ok (answers
              and right ones), st (where it is in the mastery loop), forms
              (the disguises it has been solved in), due (when a spaced
              review is due), iv (the interval before the next), seen
       log    every answer: skill, the seed that makes the question again,
              difficulty, disguise, right or not, confidence, seconds,
              answer changes, the trap a wrong choice fell into, what the
              student said happened, where it was answered, and whether the
              error lab has taken it apart yet
       scan   the last brain scan; target the score being worked toward;
       days   minutes and questions per day; prefs Socratic mode, timer */
  var API = window.OPLO_API;
  var ME = null, REC = null, BASE = null, pushT = null, pulled = {}, LISTENERS = [];
  var LOG_MAX = 600;
  function blank() { return { v: 1, at: 0, sk: {}, log: [], days: {}, scan: null, target: null, prefs: {}, mission: null }; }
  function localKey() { return "oplo.sat." + (ME ? ME.id : "anon"); }
  function readLocal() { try { return JSON.parse(localStorage.getItem(localKey()) || "null"); } catch (e) { return null; } }
  function writeLocal() { try { localStorage.setItem(localKey(), JSON.stringify(REC)); } catch (e) { /* full or blocked */ } }
  function logKey(x) { return x.at + ":" + x.k + ":" + x.s; }
  function merge(a, b) {
    a = a || blank(); b = b || blank();
    var out = blank();
    out.at = Math.max(a.at || 0, b.at || 0);
    [a.sk || {}, b.sk || {}].forEach(function (src) {
      Object.keys(src).forEach(function (id) {
        var x = src[id], y = out.sk[id];
        if (!y || (x.seen || 0) > (y.seen || 0)) out.sk[id] = Object.assign({}, x, { st: Math.max(x.st || 0, y ? y.st || 0 : 0) });
        else y.st = Math.max(y.st || 0, x.st || 0);
      });
    });
    var seen = {};
    (a.log || []).concat(b.log || []).forEach(function (x) {
      var k = logKey(x);
      if (seen[k]) { if (x.rv) seen[k].rv = 1; if (x.e && !seen[k].e) seen[k].e = x.e; return; }
      seen[k] = Object.assign({}, x);
      out.log.push(seen[k]);
    });
    out.log.sort(function (p, q) { return p.at - q.at; });
    if (out.log.length > LOG_MAX) out.log = out.log.slice(-LOG_MAX);
    [a.days || {}, b.days || {}].forEach(function (src) {
      Object.keys(src).forEach(function (d) {
        var x = src[d], y = out.days[d] || { q: 0, s: 0, m: 0 };
        out.days[d] = { q: Math.max(x.q || 0, y.q || 0), s: Math.max(x.s || 0, y.s || 0), m: Math.max(x.m || 0, y.m || 0) };
      });
    });
    ["scan", "target", "prefs", "mission"].forEach(function (k) {
      var x = a[k], y = b[k];
      out[k] = !x ? y || (k === "prefs" ? {} : null) : !y ? x : (x.at || 0) >= (y.at || 0) ? x : y;
    });
    return out;
  }
  function useAccount(me) {
    if (REC && ((ME && me && ME.id === me.id) || (!ME && !me))) return;
    ME = me || null;
    REC = readLocal() || blank();
    BASE = null;
    if (!ME || !API || !API.progress || pulled[ME.id]) return;
    pulled[ME.id] = true;
    API.progress.one("sat").then(function (row) {
      BASE = row ? row.updatedAt : 0;
      if (row && row.state) {
        REC = merge(REC, row.state);
        writeLocal();
        if (JSON.stringify(REC) !== JSON.stringify(row.state)) push();
        LISTENERS.forEach(function (f) { try { f(); } catch (e) { /* a page since left */ } });
      } else if (REC.log.length) push();
    }, function () { pulled[ME.id] = false; });
  }
  function changed() {
    REC.at = Date.now();
    writeLocal();
    clearTimeout(pushT);
    pushT = setTimeout(push, 1500);
  }
  function push(tries) {
    if (!ME || !API || !API.progress) return;
    tries = tries || 0;
    function send() {
      API.progress.put("sat", REC, null, BASE).then(function (res) { BASE = res.updatedAt; }, function (e) {
        if (e && e.status === 409 && tries < 3) {
          API.progress.one("sat").then(function (row) {
            BASE = row ? row.updatedAt : 0;
            if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
            push(tries + 1);
          });
        }
      });
    }
    if (BASE == null) {
      API.progress.one("sat").then(function (row) {
        BASE = row ? row.updatedAt : 0;
        if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
        send();
      }, function () { /* offline: kept on the device */ });
    } else send();
  }
  window.addEventListener("pagehide", function () {
    if (!pushT || !ME || !API || !API.progress || !API.progress.beacon) return;
    clearTimeout(pushT); pushT = null;
    API.progress.beacon("sat", REC, BASE);
  });
  SAT.rec = function () { return REC; };
  SAT.onSync = function (f) { LISTENERS = [f]; };

  /* ========================================================= Estimation
     A skill's ability is a number on a logit scale, nudged after every
     answer by how surprising it was: a hard question right moves it up a
     lot, an easy one right barely at all. "Understanding" is the chance of
     getting a medium question on it right. It is honest about what it has
     not seen: a skill never answered borrows its domain's average, and is
     shown as an estimate. */
  var DIFF_B = { 1: -1.3, 2: 0, 3: 1.3 };
  function skRec(id) { return REC.sk[id] || (REC.sk[id] = { th: null, n: 0, ok: 0, st: 0, forms: {}, iv: 0, due: 0, seen: 0 }); }
  function tested(id) { var s = REC.sk[id]; return !!(s && s.n > 0 && s.th != null); }
  function theta(id) {
    var s = REC.sk[id];
    if (s && s.th != null) return s.th;
    var dom = SK[id] ? SK[id].domain : 0, t = [], all = [];
    Object.keys(REC.sk).forEach(function (k) {
      var x = REC.sk[k];
      if (x.th == null || !SK[k]) return;
      all.push(x.th);
      if (SK[k].domain === dom) t.push(x.th);
    });
    var src = t.length ? t : all;
    return src.length ? src.reduce(function (a, b) { return a + b; }, 0) / src.length - 0.15 : -0.2;
  }
  function understanding(id) { return sigma(theta(id)); }
  function status(id) {
    if (!tested(id)) return "none";
    var u = understanding(id);
    return u >= 0.8 ? "good" : u >= 0.55 ? "mid" : "low";
  }
  function update(id, diff, y) {
    var s = skRec(id), b = DIFF_B[diff] || 0;
    var th = s.th == null ? theta(id) : s.th;
    var p = sigma(th - b), K = Math.max(0.32, 1.25 / Math.sqrt(1 + s.n));
    s.th = clamp(th + K * (y - p), -4, 4);
    s.n++;
    if (y >= 0.99) s.ok++;
    s.seen = Date.now();
  }
  /* A raw share of the section right, to a score on the 200–800 scale.
     The curve is the usual shape of the SAT's: steep in the middle, flatter
     at the ends. It is an estimate from practice, and is always shown with
     its range. */
  var CURVE = [[0, 200], [0.1, 290], [0.2, 360], [0.3, 420], [0.4, 475], [0.5, 530], [0.6, 580], [0.7, 625], [0.8, 675], [0.9, 730], [0.95, 765], [1, 800]];
  function toScore(f) {
    for (var i = 1; i < CURVE.length; i++) {
      if (f <= CURVE[i][0]) {
        var a = CURVE[i - 1], b = CURVE[i];
        return a[1] + (b[1] - a[1]) * (f - a[0]) / (b[0] - a[0]);
      }
    }
    return 800;
  }
  function expectedOn(id) {
    var th = theta(id);
    return (sigma(th - DIFF_B[1]) + sigma(th) + sigma(th - DIFF_B[3])) / 3;
  }
  function domainShare(n) {
    var ids = skillsIn(n);
    if (!ids.length) return 0;
    return ids.reduce(function (a, id) { return a + expectedOn(id); }, 0) / ids.length;
  }
  function estimate() {
    var any = ORDER.some(tested);
    if (!any) return null;
    var f = 0, wsum = 0;
    [1, 2, 3, 4].forEach(function (n) { if (skillsIn(n).length) { f += DOMAINS[n].w * domainShare(n); wsum += DOMAINS[n].w; } });
    f = wsum ? f / wsum : 0;
    var nAns = ORDER.reduce(function (a, id) { return a + (REC.sk[id] ? REC.sk[id].n : 0); }, 0);
    var testedCount = ORDER.filter(tested).length;
    var sc = Math.round(toScore(f) / 10) * 10;
    var spread = Math.max(20, Math.round(70 / Math.sqrt(1 + nAns / 8) + (ORDER.length - testedCount) * 3));
    spread = Math.round(spread / 10) * 10;
    return { score: sc, lo: Math.max(200, sc - spread), hi: Math.min(800, sc + spread), f: f, n: nAns, tested: testedCount };
  }
  /* What a skill could add to the score: its share of the test times what
     is not yet understood. The biggest opportunity is the largest. */
  function gain(id) {
    var d = DOMAINS[SK[id].domain], ids = skillsIn(SK[id].domain);
    return d.w / ids.length * (1 - expectedOn(id)) * 600;
  }
  SAT.understanding = understanding; SAT.status = status; SAT.estimate = estimate; SAT.tested = tested; SAT.gain = gain;

  /* ==================================================== The mastery loop
     A skill is not mastered because five questions went right. It walks:

       1 Learn        the idea, met in its lesson
       2 Guided       right with the coach beside you
       3 On your own  right first time, no help
       4 Disguised    right in two disguises it wasn't learned in
       5 Timed        right inside the time the SAT gives it
       6 Spaced       right again a day or more later
       7 Mastery check three in a row, days after that → Mastered

     Each stage opens the next; a miss never takes a stage away, but it
     brings the spaced review sooner. */
  var STAGES = SAT.STAGES = [
    { t: "Not started", s: "" },
    { t: "Learn", s: "Meet the idea" },
    { t: "Guided", s: "With the coach" },
    { t: "On your own", s: "No help" },
    { t: "Disguised", s: "In new forms" },
    { t: "Timed", s: "Against the clock" },
    { t: "Spaced", s: "Days later" },
    { t: "Mastered", s: "It stuck" }
  ];
  function stage(id) { return (REC.sk[id] && REC.sk[id].st) || 0; }
  function setStage(id, st) {
    var s = skRec(id);
    if (st > (s.st || 0)) {
      s.st = st;
      // Timed opens the spaced review: a day later, at the soonest.
      if (st === 5 && !s.due) { s.iv = 1; s.due = Date.now() + 20 * 3600000; }
      labLevel(id, st);
      return true;
    }
    return false;
  }
  /* The lab's own four levels follow the loop, so the domain pages agree
     with the SAT Map. */
  function labLevel(id, st) {
    if (!LAB.setLevel) return;
    var lv = st >= 7 ? 4 : st >= 5 ? 3 : st >= 3 ? 2 : st >= 1 ? 1 : 0;
    if (lv > LAB.level(id)) LAB.setLevel(id, lv);
  }
  function due(id) { var s = REC.sk[id]; return !!(s && s.due && s.due <= Date.now()); }
  function reviewed(id, ok) {
    var s = skRec(id);
    if (!s.due) return;
    if (ok) {
      s.iv = Math.min(21, (s.iv || 1) * 2 + 1);
      if (s.st === 5) setStage(id, 6);
      else if (s.st === 6 && s.checks >= 2) setStage(id, 7);
      else if (s.st === 6) s.checks = (s.checks || 0) + 1;
    } else { s.iv = 1; s.checks = 0; }
    s.due = Date.now() + s.iv * DAY - 4 * 3600000;
  }
  SAT.stage = stage; SAT.due = due;

  /* One answer, into the record: ability, the loop, the day, the log.
     a: { k, s, d, f, ok, c, t, ch, tr, m, help, guided, target, review } */
  function record(a) {
    useAccount(ME);
    var y = a.ok ? (a.help ? 0.6 : a.c === 0 ? 0.7 : 1) : 0;
    update(a.k, a.d, y);
    var s = skRec(a.k), moved = false, before = stage(a.k);
    // The scan only measures; the loop moves in practice.
    if (a.ok && a.m !== "scan") {
      if (a.guided || a.help) moved = setStage(a.k, 2) || moved;
      else {
        moved = setStage(a.k, before >= 2 ? 3 : 2) || moved;
        s.forms[a.f] = 1;
        var skill = SK[a.k], primary = skill ? skill.forms[0] : "equation";
        var other = Object.keys(s.forms).filter(function (f) { return f !== primary; }).length;
        if (stage(a.k) >= 3 && other >= 2) moved = setStage(a.k, 4) || moved;
        if (stage(a.k) >= 4 && a.target && a.t <= a.target) moved = setStage(a.k, 5) || moved;
      }
    }
    if (a.review) reviewed(a.k, a.ok);
    else if (!a.ok && s.due) s.due = Math.min(s.due, Date.now() + DAY);
    var day = dayKey(), D = REC.days[day] || (REC.days[day] = { q: 0, s: 0, m: 0 });
    D.q++; D.s += Math.min(a.t || 0, 600);
    REC.log.push({ k: a.k, s: a.s, d: a.d, f: a.f, ok: a.ok ? 1 : 0, c: a.c, t: Math.round(a.t || 0), tg: a.target || 0, ch: a.ch || 0,
                   p: a.p != null && a.p !== "" ? a.p : null, tr: a.tr || null, eg: a.eg || null, e: null, m: a.m || "coach", at: Date.now(), rv: a.ok ? 1 : 0 });
    if (REC.log.length > LOG_MAX) REC.log = REC.log.slice(-LOG_MAX);
    changed();
    return { moved: moved, entry: REC.log[REC.log.length - 1] };
  }
  function classify(entry, err) {
    if (!entry) return;
    entry.e = err;
    changed();
  }
  function markReviewed(entry) { if (entry) { entry.rv = 1; changed(); } }
  function lessonSeen(id) { setStage(id, 1); changed(); }
  SAT.record = record; SAT.classify = classify; SAT.markReviewed = markReviewed; SAT.lessonSeen = lessonSeen;

  /* ========================================================== Summaries */
  function misses(onlyOpen) {
    return REC.log.filter(function (x) { return !x.ok && SK[x.k] && (!onlyOpen || !x.rv); });
  }
  /* How points are lost. What the student said happened comes first; until
     they say, the trap their wrong choice fell into stands in for it (a
     choice that confused slope with intercept is a concept gap), and so do
     time and a guess. `told` counts the misses they classified themselves. */
  function errorProfile() {
    var b = {}, total = 0, told = 0;
    BUCKET_ORDER.forEach(function (k) { b[k] = 0; });
    misses().forEach(function (x) {
      var e = x.e || (x.tg && x.t > 2.2 * x.tg ? "time" : x.c === 0 ? "guess" : x.eg) || null;
      if (!e || !ERR[e]) return;
      if (x.e) told++;
      b[ERR[e].b]++; total++;
    });
    return { b: b, total: total, told: told };
  }
  function traps() {
    var t = {};
    misses().forEach(function (x) { if (x.tr) t[x.tr] = (t[x.tr] || 0) + 1; });
    return Object.keys(t).map(function (k) { return { tr: k, n: t[k] }; }).sort(function (a, b) { return b.n - a.n; });
  }
  function calibration() {
    var rows = CONF.map(function (c) { return { k: c.k, t: c.t, n: 0, ok: 0 }; });
    REC.log.forEach(function (x) { if (x.c == null || !rows[x.c]) return; rows[x.c].n++; if (x.ok) rows[x.c].ok++; });
    return rows;
  }
  function pacing() {
    var byD = {};
    [1, 2, 3, 4].forEach(function (n) { byD[n] = { n: 0, t: 0, tg: 0, slowMiss: 0 }; });
    REC.log.forEach(function (x) {
      if (!SK[x.k] || !x.t) return;
      var d = byD[SK[x.k].domain];
      d.n++; d.t += x.t; d.tg += x.tg || 95;
      if (!x.ok && x.t > 1.8 * (x.tg || 95)) d.slowMiss++;
    });
    return byD;
  }
  function streak() {
    var n = 0, t = Date.now();
    if (!REC.days[dayKey(t)]) t -= DAY;   // today not started yet still keeps yesterday's run
    while (REC.days[dayKey(t)] && REC.days[dayKey(t)].q > 0) { n++; t -= DAY; }
    return n;
  }
  SAT.misses = misses; SAT.errorProfile = errorProfile; SAT.traps = traps; SAT.calibration = calibration; SAT.pacing = pacing; SAT.streak = streak;

  /* =============================================================== Items
     A skill's generator makes an item from a seeded random source and the
     difficulty and disguise asked for:

       { stem, fig?, choices: [{ t, ok?, v?, err?, tr?, why? }] | answer + shown,
         secs?, hint, strategy, walk: [{ m, say }], concept,
         rebuild: [{ q, opts: [..], a, ok?, no? } | { q, num, ok? }],
         autopsy: { testing?, hard?, trap?, clue?, remember?, spot?: [{ t, yes, why }] } }

     A wrong choice says which error it is (err: one of ERR), names its trap
     (tr: a few words, counted across the log — "took the y-intercept for a
     root"), and says why it is tempting and why it is wrong (why). The
     generator's item is normalised here: letters, order (numbers ascending,
     the way the SAT prints them), a target time, and the skill's defaults
     filled in. The same seed and options always make the same item. */
  var LETTERS = ["A", "B", "C", "D"];
  var SECS = { 1: 70, 2: 95, 3: 125 };
  function makeItem(id, seed, o) {
    var sk = SK[id];
    if (!sk) return null;
    o = o || {};
    var R = LAB.rng(seed);
    var diff = o.diff || 2;
    var pickF = R.pick(sk.forms);
    var form = o.form && sk.forms.indexOf(o.form) > -1 ? o.form : pickF;
    var it;
    try { it = sk.gen(R, { diff: diff, form: form }); }
    catch (e) { if (window.console) console.error("SAT: " + id + " failed to make an item", e); return null; }
    if (!it) return null;
    it.skill = id; it.seed = seed; it.diff = it.diff || diff; it.form = it.form || form;
    it.type = it.choices ? "mc" : "spr";
    if (it.choices) {
      var seen = {}, list = [];
      it.choices.forEach(function (c) {
        var key = String(c.t).replace(/\s+/g, "");
        if (seen[key]) return;
        seen[key] = 1;
        list.push(c);
      });
      var right = list.filter(function (c) { return c.ok; })[0] || list[0];
      right.ok = true;
      var wrong = list.filter(function (c) { return c !== right; }).slice(0, 3);
      // Two traps that land on the same number leave a gap; a numeric
      // question fills it with a near miss, so there are always four.
      if (wrong.length < 3 && typeof right.v === "number") {
        [1, -1, 2, -2, 10, -10, 3, -3].forEach(function (dv) {
          if (wrong.length >= 3) return;
          var v = right.v + dv * (Math.abs(right.v) >= 20 && Math.abs(dv) < 10 ? 5 : 1), key = H.tex(v);
          if (list.concat(wrong).some(function (c) { return String(c.t).replace(/[\s$]+/g, "") === key.replace(/\s+/g, "") || c.v === v; })) return;
          wrong.push(H.slip(v));
        });
      }
      list = [right].concat(wrong);
      if (list.every(function (c) { return typeof c.v === "number"; }) && it.order !== "shuffle") list.sort(function (a, b) { return a.v - b.v; });
      else if (it.order !== "keep") list = R.shuffle(list);
      list.forEach(function (c, i) { c.L = LETTERS[i]; });
      it.choices = list;
      it.answer = list.indexOf(right);
    }
    it.secs = it.secs || Math.round(SECS[it.diff] * (sk.pace || 1));
    it.autopsy = Object.assign({}, sk.autopsy || {}, it.autopsy || {});
    if (!it.autopsy.spot && sk.spot) { try { it.autopsy.spot = sk.spot(R); } catch (e) { /* no examples this time */ } }
    it.ask = it.ask || sk.kind;
    return it;
  }
  SAT.makeItem = makeItem;
  /* The item an entry in the log was: same skill, seed, difficulty, form. */
  function itemOf(x) { return makeItem(x.k, x.s, { diff: x.d, form: x.f }); }
  SAT.itemOf = itemOf;

  /* A number typed the way the SAT takes it: 3/4, .75, -2.5, 12. */
  function readAns(t) {
    t = String(t || "").trim().replace(/−/g, "-").replace(/\s+/g, "");
    if (!t) return NaN;
    var mm = /^(-?\d*\.?\d+)\/(\d*\.?\d+)$/.exec(t);
    if (mm) return +mm[2] === 0 ? NaN : +mm[1] / +mm[2];
    return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
  }
  /* As the SAT marks a typed answer: a fraction or decimal equal to it, and
     a decimal cut off or rounded to the room the box has (2/3 takes .6666,
     .6667 and 0.667, not .67). */
  function sprRight(it, t) {
    var v = readAns(t);
    if (!isFinite(v)) return false;
    var targets = [it.answer].concat(it.accept || []);
    return targets.some(function (a) {
      if (Math.abs(a - Math.round(a)) < 1e-9) return Math.abs(v - a) < 1e-9;
      return Math.abs(v - a) < 0.00105;
    });
  }
  function sprValid(t) {
    t = String(t || "").trim();
    if (!t) return "";
    if (/[,$%]/.test(t)) return "No commas, dollar signs or percent signs — just the number.";
    if (/^\-?\d+ \d+\/\d+$/.test(t)) return "Mixed numbers aren't read — write 3 1/2 as 7/2 or 3.5.";
    var digits = t.replace(/[-.\/]/g, "");
    if (t.length > (t[0] === "-" ? 6 : 5) || digits.length > 5) return "Too long for the answer box — a positive answer has room for 5 characters, a negative one 6.";
    if (!isFinite(readAns(t))) return "That isn't a number the box can take.";
    return "";
  }
  SAT.sprRight = sprRight;

  /* The walkthrough, one line per step with its reason. */
  function walkHTML(walk) {
    if (!walk || !walk.length) return "";
    return '<ol class="st-walk">' + walk.map(function (w) {
      return "<li>" + (w.m ? '<span class="st-walk-m">' + m(w.m) + "</span>" : "") + (w.say ? '<span class="st-walk-s">' + fmt(w.say) + "</span>" : "") + "</li>";
    }).join("") + "</ol>";
  }
  SAT.walkHTML = walkHTML;
  function answerText(it) {
    if (it.type === "mc") return it.choices[it.answer].L + ") " + it.choices[it.answer].t;
    return it.shown || String(it.answer);
  }

  /* An item as a step the challenge player runs — for the domain pages'
     lessons and practice, which use the lab's own player. */
  function toStep(it, kicker) {
    if (!it) return { type: "learn", prompt: "This question couldn't be made." };
    var prompt = it.stem + (it.fig ? "<div class=\"st-inline-fig\">" + it.fig + "</div>" : "");
    var hints = [it.hint, it.strategy].filter(Boolean);
    var why = (it.walk ? walkHTML(it.walk) : "") + (it.concept ? '<p class="st-concept-line"><b>The idea:</b> ' + fmt(it.concept) + "</p>" : "");
    var st;
    if (it.type === "mc") {
      st = { type: "choice", prompt: prompt, keep: true, answer: it.answer,
             options: it.choices.map(function (c) { return { t: c.t, fb: c.ok ? null : c.why || null }; }) };
    } else {
      var tol = Math.abs(it.answer - Math.round(it.answer)) < 1e-9 ? 1e-9 : 0.00105;
      st = { type: "num", prompt: prompt, answer: it.answer, tol: tol, shown: it.shown || String(it.answer), pre: it.pre, post: it.post,
             near: (it.near || []).map(function (n) { return { v: n.v, fb: n.why, tol: n.tol || 1e-9 }; }) };
    }
    st.hints = hints;
    st.why = why;
    if (kicker) st.kicker = kicker;
    return st;
  }
  SAT.toStep = toStep;

  /* What kind of question is it? The right name and three others, the
     nearest ones first — telling quadratics from exponentials is the real
     test, not quadratics from circles. */
  function recogOptions(it, R) {
    var sk = SK[it.skill], same = skillsIn(sk.domain).filter(function (id) { return id !== sk.id; }),
        other = ORDER.filter(function (id) { return SK[id].domain !== sk.domain; });
    var pool = R.shuffle(same).slice(0, 2).concat(R.shuffle(other).slice(0, 1));
    var names = {}, list = [{ t: it.ask, ok: true }];
    names[it.ask] = 1;
    pool.forEach(function (id) { if (!names[SK[id].kind]) { names[SK[id].kind] = 1; list.push({ t: SK[id].kind }); } });
    return R.shuffle(list);
  }
  SAT.recogOptions = recogOptions;

  /* ============================================================== Player
     One question, the way the digital SAT sets it, with a coach behind it.

     mode "scan"    no marks; a confidence tap locks the answer in
     mode "coach"   marked at once — and a miss is the start of the lesson:
                    what were you thinking? → a response aimed at that →
                    the idea rebuilt in small questions → the explanation in
                    layers → the same idea in a different disguise
     mode "module"  a timed test: no marks, flags, the module moves you on

     o: { mode, n, total, label, recog, guided, socratic, timer ("show" |
          "hide"), flagged, onLocked(res) → log entry, onNext(), onTransfer(),
          onFlag(on), onRecog(ok), onChange() } */
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function stemHTML(it) {
    return '<div class="st-stem">' + fmt(it.stem) + "</div>" + (it.fig ? '<div class="st-qfig">' + it.fig + "</div>" : "");
  }
  function prefs() { return (REC && REC.prefs) || {}; }
  function setPref(k, v) { REC.prefs = Object.assign({}, REC.prefs || {}, { at: Date.now() }); REC.prefs[k] = v; changed(); }
  SAT.prefs = prefs; SAT.setPref = setPref;

  function qcard(it, o) {
    o = o || {};
    var mode = o.mode || "coach", coach = mode === "coach", sk = SK[it.skill];
    var st = { picked: null, struck: {}, changes: 0, t0: now(), away: 0, hiddenAt: null, locked: false, conf: null,
               text: "", help: false, entry: null, retry: false, done: false, flag: !!o.flagged };
    var api = { item: it, state: st };
    if (window.__satTest) window.__lastItem = it;
    var root = el("article", "st-q" + (mode === "module" ? " is-module" : "") + (reduced() ? "" : " in"));
    root.setAttribute("aria-label", "Question" + (o.n ? " " + o.n : ""));

    /* ---- top row: where you are, the clock, the tools */
    var head = el("header", "st-qh");
    var where = el("div", "st-qwhere");
    where.innerHTML = (o.n ? '<span class="st-qn">' + (o.label || "Question") + " " + o.n + (o.total ? " <i>of " + o.total + "</i>" : "") + "</span>" : "") +
      (o.chip ? '<span class="st-chip ' + DOMAINS[sk.domain].cls + '">' + esc(o.chip) + "</span>" : "");
    head.appendChild(where);
    var tools = el("div", "st-qtools");
    var timerB = button("st-timer", icon(I.clock) + "<b>0:00</b>" + (coach ? '<span class="st-timer-aim">aim ' + mmss(it.secs) + "</span>" : "") + '<i class="st-timer-bar"><i></i></i>');
    timerB.title = "Hide the clock";
    var timerHidden = (o.timer || prefs().timer) === "hide";
    timerB.classList.toggle("off", timerHidden);
    timerB.addEventListener("click", function () {
      timerHidden = !timerHidden;
      timerB.classList.toggle("off", timerHidden);
      timerB.title = timerHidden ? "Show the clock" : "Hide the clock";
      if (mode !== "module") setPref("timer", timerHidden ? "hide" : "show");
    });
    if (o.clock !== false) tools.appendChild(timerB);
    var coachB = null;
    if (coach && !o.guided && !o.lab) {
      coachB = button("st-tb st-coachb", icon(I.chat) + "<span>Coach me</span>");
      coachB.title = "A nudge, not the answer";
      coachB.addEventListener("click", function () { coachLadder(); });
      tools.appendChild(coachB);
    }
    var calcB = button("st-tb", icon(I.calc) + "<span>Calculator</span>");
    calcB.addEventListener("click", function () { SAT.tools.calc(); });
    var refB = button("st-tb", icon(I.ref) + "<span>Reference</span>");
    refB.addEventListener("click", function () { SAT.tools.ref(); });
    // In a module the tools live in the module's own bar.
    if (mode !== "module") { tools.appendChild(calcB); tools.appendChild(refB); }
    if (mode === "module") {
      var flagB = button("st-tb st-flagb" + (st.flag ? " on" : ""), icon(I.flag) + "<span>Mark for review</span>");
      flagB.setAttribute("aria-pressed", String(st.flag));
      flagB.addEventListener("click", function () {
        st.flag = !st.flag;
        flagB.classList.toggle("on", st.flag);
        flagB.setAttribute("aria-pressed", String(st.flag));
        if (o.onFlag) o.onFlag(st.flag);
      });
      tools.appendChild(flagB);
    }
    head.appendChild(tools);
    root.appendChild(head);

    /* ---- the question */
    var body = el("div", "st-qbody", stemHTML(it));
    root.appendChild(body);
    var coachBox = el("div", "st-coach");
    coachBox.hidden = true;
    root.appendChild(coachBox);

    /* ---- recognition, first, when asked for */
    var answerWrap = el("div", "st-answer");
    root.appendChild(answerWrap);
    var choicesEl = null, sprIn = null, sprPrev = null, sprRule = null;
    if (it.type === "mc") {
      choicesEl = el("div", "st-choices");
      choicesEl.setAttribute("role", "radiogroup");
      choicesEl.setAttribute("aria-label", "Answer choices");
      it.choices.forEach(function (c, i) {
        var row = el("div", "st-ch");
        row.dataset.i = i;
        var b = button("st-ch-b", '<span class="st-L">' + c.L + '</span><span class="st-ch-t">' + fmt(c.t) + "</span>");
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", "false");
        b.addEventListener("click", function () { choose(i); });
        var x = button("st-ch-x", '<span aria-hidden="true">' + c.L + "</span>");
        x.title = "Cross out " + c.L;
        x.setAttribute("aria-label", "Cross out choice " + c.L);
        x.addEventListener("click", function () { strike(i); });
        row.appendChild(b);
        row.appendChild(x);
        choicesEl.appendChild(row);
      });
      answerWrap.appendChild(choicesEl);
    } else {
      var box = el("div", "st-spr");
      var lab = el("label", "st-spr-l", "Your answer");
      sprIn = el("input", "st-spr-in");
      sprIn.type = "text"; sprIn.autocomplete = "off"; sprIn.spellcheck = false; sprIn.inputMode = "decimal";
      sprIn.setAttribute("aria-label", "Your answer");
      sprIn.placeholder = "Type a number";
      var id = "spr" + Math.random().toString(36).slice(2, 7);
      sprIn.id = id; lab.htmlFor = id;
      var row2 = el("div", "st-spr-row");
      if (it.pre) row2.appendChild(el("span", "st-spr-pre", fmt(it.pre)));
      row2.appendChild(sprIn);
      if (it.post) row2.appendChild(el("span", "st-spr-post", fmt(it.post)));
      sprPrev = el("div", "st-spr-prev");
      sprRule = el("p", "st-spr-rule");
      box.appendChild(lab); box.appendChild(row2); box.appendChild(sprPrev); box.appendChild(sprRule);
      box.appendChild(el("p", "st-spr-help", "Fractions or decimals. A negative answer starts with −. No mixed numbers, commas or units."));
      answerWrap.appendChild(box);
      sprIn.addEventListener("input", function () {
        var t = sprIn.value.trim(), v = readAns(t), bad = sprValid(t);
        st.text = t;
        sprRule.textContent = bad;
        var tex = !t || bad || !isFinite(v) ? "" : /\//.test(t) ? (t[0] === "-" ? "-" : "") + "\\frac{" + t.replace("-", "").split("/")[0] + "}{" + t.split("/")[1] + "}" : t;
        sprPrev.innerHTML = tex ? "Answer preview: " + m(tex) : "";
        if (st.picked == null && t) st.picked = 0;
        if (!t) st.picked = null;
        ready();
      });
      sprIn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && isReady()) { e.preventDefault(); if (mode === "module") { if (o.onEnter) o.onEnter(); } else if (lockEl && !lockEl.hidden) { var f = lockEl.querySelector(".st-conf-b.dflt") || lockEl.querySelector(".st-conf-b"); if (f) f.focus(); } }
      });
    }
    if (o.recog) {
      answerWrap.hidden = true;
      var rec = el("div", "st-recog");
      rec.innerHTML = '<p class="st-recog-q">' + icon(I.eye) + "<span><b>Before you solve it:</b> what kind of question is this?</span></p>";
      var ropts = el("div", "st-recog-opts");
      var R = LAB.rng(it.seed + ":recog");
      recogOptions(it, R).forEach(function (x) {
        var b = button("st-recog-b", esc(x.t));
        b.addEventListener("click", function () {
          [].forEach.call(ropts.children, function (c) { c.disabled = true; if (c.textContent === it.ask) c.classList.add("yes"); });
          if (!x.ok) b.classList.add("no");
          var say = el("p", "st-recog-say" + (x.ok ? " ok" : ""));
          say.innerHTML = x.ok ? "<b>Yes.</b> Naming it is half the work — you know which tools to reach for."
            : "<b>It's " + esc(it.ask) + ".</b> " + (it.autopsy && it.autopsy.clue ? "The clue: " + fmt(it.autopsy.clue) : "Look for what the question gives you and what it asks for.");
          rec.appendChild(say);
          if (o.onRecog) o.onRecog(!!x.ok);
          var go = button("st-btn primary sm", "Now solve it" + icon(I.arrow));
          go.addEventListener("click", function () { rec.remove(); answerWrap.hidden = false; st.t0 = now(); showLock(); focusSoon(sprIn || root); });
          rec.appendChild(go);
          focusSoon(go);
        });
        ropts.appendChild(b);
      });
      rec.appendChild(ropts);
      root.insertBefore(rec, answerWrap);
    }

    /* ---- the lock-in: an answer and how sure you are, in one tap */
    var lockEl = null;
    if (mode !== "module") {
      lockEl = el("div", "st-lock");
      lockEl.innerHTML = '<p class="st-lock-q">How sure are you?</p>';
      var cb = el("div", "st-conf");
      CONF.forEach(function (c) {
        var b = button("st-conf-b c" + c.k, confBars(c.k) + "<b>" + c.t + "</b>");
        b.title = c.s + " — press " + (c.k + 1);
        b.addEventListener("click", function () { if (isReady()) lock(c.k); });
        cb.appendChild(b);
      });
      lockEl.appendChild(cb);
      if (mode === "scan") {
        var skip = button("st-skip", "I don't know this one — skip");
        skip.addEventListener("click", function () { st.picked = null; st.skipped = true; lock(0); });
        lockEl.appendChild(skip);
      }
      root.appendChild(lockEl);
    }
    var fb = el("section", "st-fb");
    fb.setAttribute("aria-live", "polite");
    root.appendChild(fb);

    /* ---- choosing, crossing out */
    function choose(i) {
      if (st.locked && !st.retry) return;
      if (st.struck[i]) strike(i);
      if (st.picked != null && st.picked !== i) st.changes++;
      st.picked = i;
      [].forEach.call(choicesEl.children, function (row, k) {
        row.classList.toggle("on", k === i);
        row.firstChild.setAttribute("aria-checked", String(k === i));
      });
      ready();
      if (o.onChange) o.onChange();
    }
    function strike(i) {
      if (st.locked && !st.retry) return;
      st.struck[i] = !st.struck[i];
      var row = choicesEl.children[i];
      row.classList.toggle("struck", !!st.struck[i]);
      row.lastChild.setAttribute("aria-pressed", String(!!st.struck[i]));
      if (st.struck[i] && st.picked === i) { st.picked = null; row.classList.remove("on"); row.firstChild.setAttribute("aria-checked", "false"); ready(); }
    }
    function isReady() { return it.type === "mc" ? st.picked != null : !!st.text && !sprValid(st.text) && isFinite(readAns(st.text)); }
    function showLock() { if (lockEl && !st.locked) lockEl.classList.toggle("on", isReady()); }
    function ready() { showLock(); }
    api.ready = isReady;
    api.answer = function () { return it.type === "mc" ? st.picked : st.text; };
    api.isRight = function () { return it.type === "mc" ? st.picked === it.answer : sprRight(it, st.text); };

    /* ---- the clock: time on this question, not counting time away */
    function secs() { return (now() - st.t0 - st.away) / 1000; }
    api.secs = secs;
    function onVis() {
      if (document.hidden) st.hiddenAt = now();
      else if (st.hiddenAt != null) { st.away += now() - st.hiddenAt; st.hiddenAt = null; }
    }
    document.addEventListener("visibilitychange", onVis);
    var tick = setInterval(function () {
      if (!root.isConnected) return;
      if (st.done && mode !== "module") return;
      var s = secs();
      timerB.querySelector("b").textContent = mmss(s);
      var k = Math.min(1, s / it.secs);
      timerB.querySelector(".st-timer-bar i").style.width = (k * 100).toFixed(1) + "%";
      timerB.classList.toggle("over", s > it.secs);
    }, 500);
    api.destroy = function () { clearInterval(tick); document.removeEventListener("visibilitychange", onVis); };
    api.addTime = function (ms) { st.t0 -= ms; };

    /* ---- keys: A–D choose, 1–4 lock in with that confidence */
    function onKey(e) {
      if (!root.isConnected) { document.removeEventListener("keydown", onKey); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      if (!root.getClientRects().length) return;
      var k = e.key.toLowerCase();
      if (choicesEl && !answerWrap.hidden && (!st.locked || st.retry) && /^[abcd]$/.test(k)) { e.preventDefault(); choose(k.charCodeAt(0) - 97); }
      else if (lockEl && lockEl.classList.contains("on") && !st.locked && /^[1-4]$/.test(k)) { e.preventDefault(); lock(+k - 1); }
    }
    document.addEventListener("keydown", onKey);
    var destroy0 = api.destroy;
    api.destroy = function () { destroy0(); document.removeEventListener("keydown", onKey); };

    /* ---- locking in */
    function result() {
      var ok = api.isRight(), c = it.type === "mc" && st.picked != null ? it.choices[st.picked] : null;
      var tr = null, eg = null;
      if (!ok) {
        if (c) { tr = c.tr || null; eg = c.err || null; }
        else if (it.type === "spr") {
          var v = readAns(st.text), near = (it.near || []).filter(function (n) { return Math.abs(v - n.v) <= (n.tol || 1e-9); })[0];
          tr = near ? near.tr || null : null;
          eg = near ? near.err || "calc" : null;
        }
      }
      return { ok: ok, picked: st.picked, text: st.text, conf: st.conf, t: secs(), ch: st.changes, tr: tr, eg: eg, skipped: !!st.skipped, help: st.help };
    }
    api.result = result;
    function lock(conf) {
      if (st.locked) return;
      st.locked = true;
      st.conf = conf;
      root.classList.add("locked");
      if (lockEl) { lockEl.classList.remove("on"); lockEl.classList.add("gone"); }
      var res = result();
      if (sprIn) sprIn.disabled = true;
      st.entry = o.onLocked ? o.onLocked(res) : null;
      if (mode === "scan") { st.done = true; return; }
      if (coach) { if (res.ok) rightFlow(res); else wrongFlow(res); }
    }
    api.lock = lock;

    /* ================================================ the coach's replies */
    function say(cls, html) {
      var n = el("div", "st-say " + (cls || "") + (reduced() ? "" : " in"), html);
      fb.appendChild(n);
      scrollIntoViewSoft(n);
      return n;
    }
    function markChoices(showRight) {
      if (!choicesEl) return;
      [].forEach.call(choicesEl.children, function (row, k) {
        row.classList.remove("on");
        if (k === st.picked && k !== it.answer) row.classList.add("no");
        if (showRight && k === it.answer) row.classList.add("yes");
        row.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
      });
    }
    function timeLine(t) {
      var over = t > it.secs;
      return '<span class="st-tline' + (over ? " over" : "") + '">' + icon(I.clock) + mmss(t) + " · aim " + mmss(it.secs) +
        (over ? " — right, but slow. The strategy below is the faster way." : "") + "</span>";
    }
    function rightFlow(res) {
      st.done = true;
      markChoices(true);
      if (sprIn) sprIn.parentNode.parentNode.classList.add("yes");
      var guess = res.conf != null && res.conf <= 1;
      var lead = res.help ? "Right — with a little help. That's what it's for." : guess ? "Right — even though you weren't sure." : pickPraise(it.seed);
      var s = say("ok", '<div class="st-say-h">' + icon(I.check) + "<b>" + lead + "</b>" + timeLine(res.t) + "</div>" +
        (guess && it.strategy ? '<p class="st-sure">You said you were ' + (res.conf === 0 ? "guessing" : "unsure") + ". Here's the idea that made it right, so next time you'll know: " + fmt(it.strategy) + "</p>" : ""));
      s.appendChild(layers(it, { open: res.t > it.secs ? "strategy" : null, collapsed: !guess && res.t <= it.secs }));
      if (it.diff >= 3) fb.appendChild(autopsyCard(it, null));
      finishRow({ transfer: false });
    }
    var PRAISE = ["Right.", "Exactly right.", "Right — clean.", "Nailed it.", "That's it."];
    function pickPraise(seed) { return PRAISE[Math.abs(String(seed).split("").reduce(function (a, c) { return a * 31 + c.charCodeAt(0) | 0; }, 7)) % PRAISE.length]; }

    function wrongFlow(res) {
      markChoices(false);
      if (sprIn) sprIn.parentNode.parentNode.classList.add("no");
      var pickedTxt = it.type === "mc" ? (res.picked != null ? it.choices[res.picked].L : null) : st.text;
      say("no", '<div class="st-say-h">' + icon(I.x) + "<b>Not this time.</b><span>Let's find where it slipped — the answer comes after.</span></div>");
      var ask = say("ask", '<p class="st-ask-q">' + (res.skipped ? "What stopped you?" : it.type === "mc" ? "What were you thinking when you chose <b>" + esc(pickedTxt) + "</b>?" : "What happened with <b>" + esc(pickedTxt) + "</b>?") + "</p>");
      var chips = el("div", "st-errs");
      ERR_ORDER.forEach(function (k) {
        if (k === "two" && it.type !== "mc") return;
        var b = button("st-err", esc(ERR[k].t));
        b.addEventListener("click", function () { pickErr(k, b); });
        chips.appendChild(b);
      });
      var nb = button("st-err ghost", "Not sure");
      nb.addEventListener("click", function () { pickErr(null, nb); });
      chips.appendChild(nb);
      ask.appendChild(chips);
      focusSoon(chips.firstChild);
      function pickErr(k, b) {
        [].forEach.call(chips.children, function (c) { c.disabled = true; c.classList.toggle("on", c === b); });
        if (k) classify(st.entry, k);
        respond(k);
      }
    }
    function respond(k) {
      var picked = it.type === "mc" && st.picked != null ? it.choices[st.picked] : null;
      if (k === "calc") retry("<b>Slips happen.</b> Rework it — " + (picked ? "your answer is crossed out; the other three are still here." : "the box is open again."));
      else if (k === "misread" || k === "graph") retry("<b>Read it once more.</b> " + (it.autopsy.clue ? "The key clue: " + fmt(it.autopsy.clue) : "Say to yourself exactly what it asks for before you solve."));
      else if (k === "two" && picked && picked.why) retry("<b>Here's why " + picked.L + " doesn't hold up:</b> " + fmt(picked.why) + " Try again.");
      else if (k === "time" && it.strategy) retry("<b>There's a faster way.</b> " + fmt(it.strategy));
      else rebuild(true);
    }
    /* Another go at the same question: the wrong answer crossed out, no
       confidence asked, and a second miss goes to the rebuild. */
    function retry(msg, after) {
      st.retry = true; st.help = true;
      var n = say("retry", '<p>' + msg + "</p>");
      if (choicesEl) {
        [].forEach.call(choicesEl.children, function (row, k) {
          row.classList.remove("no", "on");
          row.querySelectorAll("button").forEach(function (b) { b.disabled = false; });
          if (k === st.picked) { st.struck[k] = false; strike(k); row.querySelectorAll("button").forEach(function (b) { b.disabled = true; }); }
        });
        st.picked = null;
      } else if (sprIn) { sprIn.disabled = false; sprIn.parentNode.parentNode.classList.remove("no"); sprIn.value = ""; st.text = ""; focusSoon(sprIn); }
      var go = button("st-btn primary sm", "Check");
      go.disabled = true;
      var poll = setInterval(function () { if (!root.isConnected) { clearInterval(poll); return; } go.disabled = !isReady(); }, 150);
      go.addEventListener("click", function () {
        if (!isReady()) return;
        clearInterval(poll);
        go.remove();
        st.retry = false;
        var ok = api.isRight();
        if (sprIn) sprIn.disabled = true;
        if (ok) {
          markChoices(true);
          if (sprIn) sprIn.parentNode.parentNode.classList.add("yes");
          say("ok", '<div class="st-say-h">' + icon(I.check) + "<b>" + (after === "socratic" ? "You got there yourself." : "You fixed it yourself.") + "</b><span>That counts for more than getting it handed to you.</span></div>");
          if (after === "socratic") explainBack();
          else reveal({ open: "strategy", quiet: true });
        } else {
          markChoices(false);
          say("no", '<div class="st-say-h">' + icon(I.x) + "<b>Still not it.</b><span>Let's build it up from the start.</span></div>");
          if (after === "socratic") reveal({});
          else rebuild(false);
        }
      });
      n.appendChild(go);
    }
    /* The idea rebuilt one small question at a time — the student does each
       step; the coach only asks. */
    function rebuild(first) {
      var steps = it.rebuild || [];
      if (!steps.length) { reveal({}); return; }
      var box = say("rebuild", '<div class="st-rb-h">' + icon(I.steps) + "<b>Let's rebuild it, one small step at a time.</b></div>");
      var list = el("ol", "st-rb");
      box.appendChild(list);
      var i = 0;
      function nextStep() {
        if (i >= steps.length) { done(); return; }
        var s = steps[i], li = el("li", "st-rb-s" + (reduced() ? "" : " in")), tries = 0;
        li.innerHTML = '<p class="st-rb-q"><span class="st-rb-n">Step ' + (i + 1) + "</span>" + fmt(s.q) + "</p>";
        var wrap = el("div", "st-rb-a");
        li.appendChild(wrap);
        list.appendChild(li);
        scrollIntoViewSoft(li);
        function good() {
          wrap.querySelectorAll("button,input").forEach(function (b) { b.disabled = true; });
          li.classList.add("ok");
          li.appendChild(el("p", "st-rb-ok", icon(I.check) + "<span>" + fmt(s.ok || "Yes.") + "</span>"));
          i++;
          setTimeout(nextStep, reduced() ? 0 : 260);
        }
        function bad(msg) {
          tries++;
          var old = li.querySelector(".st-rb-no");
          if (old) old.remove();
          if (tries >= 2) {
            li.appendChild(el("p", "st-rb-no", "<span>" + (msg ? fmt(msg) + " " : "") + "It's <b>" + fmt(s.opts ? s.opts[s.a] : String(s.shown || s.num)) + "</b>.</span>"));
            good();
            return;
          }
          li.appendChild(el("p", "st-rb-no", "<span>" + fmt(msg || "Not quite — look again.") + "</span>"));
        }
        if (s.opts) {
          s.opts.forEach(function (t, k) {
            var b = button("st-rb-b", fmt(t));
            b.addEventListener("click", function () {
              if (k === s.a) { b.classList.add("yes"); good(); }
              else { b.classList.add("no"); b.disabled = true; bad(s.no && s.no[k]); }
            });
            wrap.appendChild(b);
          });
          focusSoon(wrap.firstChild);
        } else {
          var inp = el("input", "st-rb-in");
          inp.type = "text"; inp.inputMode = "decimal"; inp.autocomplete = "off"; inp.setAttribute("aria-label", "Your answer to step " + (i + 1));
          var b2 = button("st-btn sm", "Check");
          function check() {
            var v = readAns(inp.value);
            if (!isFinite(v)) return;
            if (Math.abs(v - s.num) < (s.tol || 1e-6)) { inp.classList.add("yes"); good(); }
            else { inp.classList.add("no"); bad(s.no && s.no[0]); setTimeout(function () { inp.classList.remove("no"); }, 600); }
          }
          b2.addEventListener("click", check);
          inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } });
          if (s.pre) wrap.appendChild(el("span", "st-rb-pre", fmt(s.pre)));
          wrap.appendChild(inp);
          wrap.appendChild(b2);
          focusSoon(inp);
        }
      }
      function done() {
        if (o.socratic || prefs().socratic) {
          retry("<b>Now finish it yourself.</b> You've built every piece — put them together and answer the question.", "socratic");
        } else reveal({ open: "walk" });
      }
      nextStep();
      void first;
    }
    /* Explain it back: the student's own words beside a model, and an honest
       comparison — no machine marks a student's reasoning. */
    function explainBack() {
      var box = say("explain", '<p class="st-ask-q"><b>Now explain your reasoning to me.</b> One or two sentences: what did you do, and why does it work?</p>');
      var ta = el("textarea", "st-ta");
      ta.rows = 3;
      ta.placeholder = "First I… then… because…";
      box.appendChild(ta);
      var go = button("st-btn sm", "Compare with the coach's");
      go.disabled = true;
      ta.addEventListener("input", function () { go.disabled = ta.value.trim().split(/\s+/).length < 4; });
      go.addEventListener("click", function () {
        ta.readOnly = true; go.remove();
        var model = el("div", "st-model", '<p class="st-lbl">The coach\'s version</p>' + walkHTML(it.walk) + (it.concept ? '<p class="st-concept-line"><b>Why it works:</b> ' + fmt(it.concept) + "</p>" : ""));
        box.appendChild(model);
        var rate = el("div", "st-rate");
        rate.innerHTML = "<p>Did yours say the same thing?</p>";
        ["I had it", "Partly", "Not yet"].forEach(function (t, k) {
          var b = button("st-btn sm" + (k === 0 ? " primary" : ""), t);
          b.addEventListener("click", function () {
            rate.innerHTML = '<p class="st-rated">' + (k === 0 ? "Then you own this one." : k === 1 ? "Add the missing piece to your notes — it'll come back in a review." : "That's what the review is for — this one will come back.") + "</p>";
            reveal({ quiet: true, noLayers: false, open: null });
          });
          rate.appendChild(b);
        });
        box.appendChild(rate);
      });
      box.appendChild(go);
      focusSoon(ta);
    }
    function reveal(r) {
      st.done = true;
      if (!r.quiet) {
        markChoices(true);
        var picked = it.type === "mc" && st.picked != null ? it.choices[st.picked] : null;
        var h = '<div class="st-say-h">' + icon(I.bulb) + "<b>The answer is " + fmt(answerText(it)) + ".</b></div>";
        if (picked && picked.why) h += '<p class="st-tempt"><span class="st-lbl">Why ' + picked.L + " was tempting</span>" + fmt(picked.why) + "</p>";
        say("reveal", h);
      }
      var lay = layers(it, { open: r.open || null, collapsed: !!r.quiet });
      fb.appendChild(lay);
      if (it.autopsy && (it.autopsy.trap || it.autopsy.spot)) fb.appendChild(autopsyCard(it, it.type === "mc" && st.picked != null ? it.choices[st.picked] : null));
      finishRow({ transfer: true });
    }
    /* The coach, asked before answering: a nudge, then a stronger one, then
       the guiding questions — never the answer. */
    var ladder = 0;
    function coachLadder() {
      if (st.locked) return;
      st.help = true;
      coachBox.hidden = false;
      var rungs = [
        it.hint ? { t: "A nudge", h: it.hint } : null,
        it.strategy ? { t: "A strategy", h: it.strategy } : null,
        it.rebuild && it.rebuild.length ? { t: "Walk me through it", rb: true } : null
      ].filter(Boolean);
      var r = rungs[ladder];
      if (!r) return;
      ladder++;
      if (r.rb) {
        var rbHost = el("div", "st-coach-rb");
        coachBox.appendChild(rbHost);
        miniRebuild(it.rebuild, rbHost, function () {
          rbHost.appendChild(el("p", "st-coach-fin", "<b>Now finish it:</b> pick your answer above."));
        });
      } else {
        coachBox.appendChild(el("div", "st-coach-rung" + (reduced() ? "" : " in"), '<span class="st-lbl">' + icon(I.chat) + r.t + "</span><p>" + fmt(r.h) + "</p>"));
      }
      var cbtn = head.querySelector(".st-coachb");
      if (cbtn) {
        var nx = rungs[ladder];
        if (nx) cbtn.querySelector("span").textContent = nx.rb ? "Walk me through it" : "Another nudge";
        else cbtn.hidden = true;
      }
    }
    if (o.guided && coach) {
      // Guided: the coach walks first, then the student answers.
      st.help = true;
      coachBox.hidden = false;
      coachBox.appendChild(el("p", "st-guided-h", icon(I.chat) + "<b>Guided.</b> Answer the small questions first — they add up to the big one."));
      var rbHost2 = el("div", "st-coach-rb");
      coachBox.appendChild(rbHost2);
      answerWrap.classList.add("wait");
      miniRebuild(it.rebuild || [], rbHost2, function () {
        answerWrap.classList.remove("wait");
        rbHost2.appendChild(el("p", "st-coach-fin", "<b>Now the real question:</b> " + (choicesEl ? "choose your answer." : "type your answer.")));
        focusSoon(sprIn || root);
      });
    }
    function finishRow(f) {
      var row = el("div", "st-next");
      if (f.transfer && o.onTransfer) {
        var tb = button("st-btn", icon(I.mask) + "<span>Same idea, different disguise</span>");
        tb.addEventListener("click", function () { tb.disabled = true; tb.innerHTML = icon(I.check) + "<span>Added — it's next</span>"; o.onTransfer(); });
        row.appendChild(tb);
      }
      var nb = button("st-btn primary", "<span>" + (o.nextLabel || "Next") + "</span>" + icon(I.arrow));
      nb.addEventListener("click", function () { if (o.onNext) o.onNext(); });
      row.appendChild(nb);
      fb.appendChild(row);
      focusSoon(nb);
      scrollIntoViewSoft(row);
    }
    if (o.lab) {
      // The Error Lab: the answer given at the time is already locked in,
      // and the coach starts at "what were you thinking?".
      var given = o.lab.picked;
      st.entry = o.lab.entry;
      st.skipped = given == null || given === "";
      if (!st.skipped) {
        if (it.type === "mc" && choicesEl.children[+given]) { st.picked = +given; choicesEl.children[st.picked].classList.add("on"); }
        else if (sprIn) { st.text = String(given); sprIn.value = st.text; }
      }
      st.locked = true;
      root.classList.add("locked");
      if (lockEl) lockEl.classList.add("gone");
      if (sprIn) sprIn.disabled = true;
      timerB.hidden = true;
      if (coachB) coachB.hidden = true;
      wrongFlow({ ok: false, picked: st.picked, text: st.text, conf: null, t: 0, skipped: st.skipped });
    }
    api.el = root;
    // Focus the question itself, not a choice: a ring on choice A reads as
    // "A is selected". Tab reaches the choices; A–D pick them.
    root.tabIndex = -1;
    api.focus = function () { if (!o.recog && !o.guided) focusSoon(sprIn || root); };
    /* For the module: the answer shown again when coming back to it. */
    api.restore = function (ans) {
      if (ans == null) return;
      if (it.type === "mc") choose(ans); else { sprIn.value = ans; sprIn.dispatchEvent(new Event("input")); }
    };
    api.strikes = function (s) { if (s) Object.keys(s).forEach(function (k) { if (s[k] && !st.struck[k]) strike(+k); }); return st.struck; };
    return api;
  }
  SAT.qcard = qcard;

  /* The guiding questions, played small — inside the coach box. */
  function miniRebuild(steps, host, onDone) {
    var i = 0;
    function go() {
      if (i >= steps.length) { onDone(); return; }
      var s = steps[i], row = el("div", "st-mrb" + (reduced() ? "" : " in")), tries = 0;
      row.innerHTML = '<p class="st-rb-q"><span class="st-rb-n">' + (i + 1) + "</span>" + fmt(s.q) + "</p>";
      var wrap = el("div", "st-rb-a");
      row.appendChild(wrap);
      host.appendChild(row);
      function good() {
        wrap.querySelectorAll("button,input").forEach(function (b) { b.disabled = true; });
        row.classList.add("ok");
        row.appendChild(el("p", "st-rb-ok", icon(I.check) + "<span>" + fmt(s.ok || "Yes.") + "</span>"));
        i++;
        setTimeout(go, reduced() ? 0 : 220);
      }
      function bad(msg) {
        tries++;
        var old = row.querySelector(".st-rb-no"); if (old) old.remove();
        if (tries >= 2) { row.appendChild(el("p", "st-rb-no", "<span>It's <b>" + fmt(s.opts ? s.opts[s.a] : String(s.shown || s.num)) + "</b>.</span>")); good(); return; }
        row.appendChild(el("p", "st-rb-no", "<span>" + fmt(msg || "Not quite — look again.") + "</span>"));
      }
      if (s.opts) s.opts.forEach(function (t, k) {
        var b = button("st-rb-b", fmt(t));
        b.addEventListener("click", function () { if (k === s.a) { b.classList.add("yes"); good(); } else { b.classList.add("no"); b.disabled = true; bad(s.no && s.no[k]); } });
        wrap.appendChild(b);
      });
      else {
        var inp = el("input", "st-rb-in");
        inp.type = "text"; inp.inputMode = "decimal"; inp.autocomplete = "off"; inp.setAttribute("aria-label", "Your answer");
        var b2 = button("st-btn sm", "Check");
        function check() { var v = readAns(inp.value); if (!isFinite(v)) return; if (Math.abs(v - s.num) < (s.tol || 1e-6)) { inp.classList.add("yes"); good(); } else bad(s.no && s.no[0]); }
        b2.addEventListener("click", check);
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } });
        if (s.pre) wrap.appendChild(el("span", "st-rb-pre", fmt(s.pre)));
        wrap.appendChild(inp); wrap.appendChild(b2);
      }
      scrollIntoViewSoft(row);
    }
    go();
  }

  /* ============================================== The explanation, in layers
     Hint → Strategy → Walkthrough → Concept. A student opens as much as they
     need; after a miss it opens on the walkthrough, after a right answer it
     stays folded. */
  function layers(it, o) {
    o = o || {};
    var tabs = [
      it.hint ? { k: "hint", t: "Hint", h: "<p>" + fmt(it.hint) + "</p>" } : null,
      it.strategy ? { k: "strategy", t: "Strategy", h: "<p>" + fmt(it.strategy) + "</p>" } : null,
      it.walk ? { k: "walk", t: "Walkthrough", h: walkHTML(it.walk) } : null,
      it.concept ? { k: "concept", t: "Concept", h: "<p>" + fmt(it.concept) + "</p>" + schoolLine(it.skill) } : null
    ].filter(Boolean);
    var box = el("div", "st-layers" + (o.collapsed ? " folded" : ""));
    var bar = el("div", "st-lay-tabs");
    bar.setAttribute("role", "tablist");
    var panel = el("div", "st-lay-panel");
    panel.setAttribute("role", "tabpanel");
    var open = o.open || (o.collapsed ? null : "walk");
    if (o.collapsed) {
      var unfold = button("st-lay-open", icon(I.layers) + "<span>See why it works</span>" + icon(I.down));
      unfold.addEventListener("click", function () { box.classList.remove("folded"); unfold.remove(); pick(open || "strategy"); });
      box.appendChild(unfold);
    }
    tabs.forEach(function (t, i) {
      var b = button("st-lay-tab", '<span class="st-lay-n">' + (i + 1) + "</span>" + t.t);
      b.setAttribute("role", "tab");
      b.dataset.k = t.k;
      b.addEventListener("click", function () { pick(t.k); });
      bar.appendChild(b);
    });
    function pick(k) {
      var t = tabs.filter(function (x) { return x.k === k; })[0] || tabs[0];
      if (!t) return;
      [].forEach.call(bar.children, function (b) { var on = b.dataset.k === t.k; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
      panel.innerHTML = t.h;
      panel.className = "st-lay-panel k-" + t.k + (reduced() ? "" : " in");
    }
    box.appendChild(bar);
    box.appendChild(panel);
    if (!o.collapsed) pick(open);
    return box;
  }
  SAT.layers = layers;
  function schoolLine(id) {
    var sk = SK[id];
    if (!sk || !sk.school) return "";
    return '<p class="st-school">' + icon(I.school) + "<span><b>Not just an SAT skill.</b> It's the idea of " + esc(sk.school.t) + " — the same one you'd meet in class.</span></p>";
  }

  /* ====================================================== Question autopsy
     After a hard question, or a miss: what it was really testing, what made
     it hard, the trap, the clue, the skill — and three tiny examples to spot
     the pattern in. */
  function autopsyCard(it, picked) {
    var a = it.autopsy || {}, sk = SK[it.skill];
    var box = el("section", "st-autopsy" + (reduced() ? "" : " in"));
    var rows = [
      ["What was it really testing?", a.testing || sk.t],
      ["What made it difficult?", a.hard],
      ["The trap", picked && picked.why && picked.tr ? picked.tr.charAt(0).toUpperCase() + picked.tr.slice(1) + "." : a.trap],
      ["Key clue", a.clue],
      ["SAT skill", DOMAINS[sk.domain].t + " · " + (a.skill || sk.t)],
      ["Remember", a.remember]
    ].filter(function (r) { return r[1]; });
    box.innerHTML = '<header class="st-ap-h">' + icon(I.scope) + "<b>Question autopsy</b><span>Take it apart so the next one looks familiar.</span></header>" +
      '<dl class="st-ap">' + rows.map(function (r) { return "<div><dt>" + esc(r[0]) + "</dt><dd>" + fmt(r[1]) + "</dd></div>"; }).join("") + "</dl>";
    if (a.spot && a.spot.length) {
      var sp = el("div", "st-spot");
      sp.innerHTML = '<p class="st-spot-h"><b>Can you spot it?</b> ' + esc(a.spotQ || "Does each of these ask the same thing?") + "</p>";
      var list = el("div", "st-spot-list");
      a.spot.slice(0, 3).forEach(function (x) {
        var card = el("div", "st-spot-c");
        card.innerHTML = '<p class="st-spot-t">' + fmt(x.t) + "</p>";
        var yn = el("div", "st-spot-yn");
        [["Yes", true], ["No", false]].forEach(function (p) {
          var b = button("st-spot-b", p[0]);
          b.addEventListener("click", function () {
            var ok = p[1] === !!x.yes;
            [].forEach.call(yn.children, function (c) { c.disabled = true; });
            b.classList.add(ok ? "yes" : "no");
            card.appendChild(el("p", "st-spot-why" + (ok ? " ok" : ""), "<b>" + (ok ? "Right." : x.yes ? "It does." : "It doesn't.") + "</b> " + fmt(x.why || "")));
          });
          yn.appendChild(b);
        });
        card.appendChild(yn);
        list.appendChild(card);
      });
      sp.appendChild(list);
      box.appendChild(sp);
    }
    return box;
  }
  SAT.autopsyCard = autopsyCard;

  /* =============================================================== Tools
     What the digital SAT puts beside every math question: a graphing
     calculator and the reference sheet. The calculator here does both jobs
     the SAT's does — work out a number, or graph both sides of an equation
     and read where they meet — because "graph it" is a strategy worth
     learning, not a crutch. Each opens as a panel at the side and stays
     open from question to question. */
  var TOOLS = SAT.tools = {};
  var panels = {};
  function panel(key, title, build) {
    if (panels[key] && panels[key].isConnected) {
      var open = panels[key].classList.toggle("on");
      if (open) { var f = panels[key].querySelector("input"); if (f) focusSoon(f); }
      return panels[key];
    }
    var p = el("aside", "st-tool st-tool-" + key + " on");
    p.setAttribute("aria-label", title);
    var h = el("header", "st-tool-h", "<b>" + esc(title) + "</b>");
    var x = button("st-tool-x", icon(I.x));
    x.setAttribute("aria-label", "Close " + title);
    x.addEventListener("click", function () { p.classList.remove("on"); });
    h.appendChild(x);
    p.appendChild(h);
    var body = el("div", "st-tool-b");
    p.appendChild(body);
    build(body, p);
    document.body.appendChild(p);
    panels[key] = p;
    p.addEventListener("keydown", function (e) { if (e.key === "Escape") p.classList.remove("on"); });
    return p;
  }
  TOOLS.close = function () { Object.keys(panels).forEach(function (k) { if (panels[k]) panels[k].classList.remove("on"); }); };

  /* An expression a person types into a calculator, made ready for the
     lab's parser: × ÷ π √, 2(3), 3x, sqrt, and "y =" dropped. */
  function calcPrep(t) {
    return String(t).replace(/^\s*y\s*=\s*/i, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/√\s*\(/g, "sqrt(")
      .replace(/√\s*([0-9.]+)/g, "sqrt($1)").replace(/\*\*/g, "^").replace(/−/g, "-");
  }
  function evalCalc(t) {
    var tree = LAB.parse(calcPrep(t));
    var v = LAB.evalTree(tree, { pi: Math.PI, e: Math.E });
    if (!isFinite(v)) throw new Error("That doesn't come out to a number.");
    return v;
  }
  function asFraction(v) {
    if (Math.abs(v - Math.round(v)) < 1e-9) return null;
    for (var d = 2; d <= 400; d++) { var n = v * d; if (Math.abs(n - Math.round(n)) < 1e-7) return (Math.round(n) < 0 ? "-" : "") + "\\frac{" + Math.abs(Math.round(n)) + "}{" + d + "}"; }
    return null;
  }
  function shown(v) { return num(Math.round(v * 1e8) / 1e8); }

  TOOLS.calc = function () {
    return panel("calc", "Calculator", function (body) {
      var tabs = el("div", "st-seg");
      var tCalc = button("st-seg-b on", "Calculate"), tGraph = button("st-seg-b", "Graph");
      tabs.appendChild(tCalc); tabs.appendChild(tGraph);
      body.appendChild(tabs);
      var calcP = el("div", "st-calc-p"), graphP = el("div", "st-graph-p");
      graphP.hidden = true;
      body.appendChild(calcP); body.appendChild(graphP);
      tCalc.addEventListener("click", function () { tCalc.classList.add("on"); tGraph.classList.remove("on"); calcP.hidden = false; graphP.hidden = true; });
      tGraph.addEventListener("click", function () { tGraph.classList.add("on"); tCalc.classList.remove("on"); graphP.hidden = false; calcP.hidden = true; drawGraph(); });

      /* Calculate: type, see the result as you go, Enter keeps it. */
      var inp = el("input", "st-calc-in");
      inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false;
      inp.placeholder = "e.g. 3(4.5)^2 − 12/5";
      inp.setAttribute("aria-label", "Expression to calculate");
      var out = el("div", "st-calc-out");
      var keys = el("div", "st-calc-keys");
      [["(", "("], [")", ")"], ["^", "^"], ["√", "sqrt("], ["π", "pi"], ["/", "/"], ["×", "*"], ["−", "-"]].forEach(function (k) {
        var b = button("st-key", k[0]);
        b.addEventListener("mousedown", function (e) { e.preventDefault(); });
        b.addEventListener("click", function () { var p = inp.selectionStart || inp.value.length; inp.value = inp.value.slice(0, p) + k[1] + inp.value.slice(inp.selectionEnd || p); inp.focus(); inp.setSelectionRange(p + k[1].length, p + k[1].length); show(); });
        keys.appendChild(b);
      });
      var hist = el("ol", "st-calc-hist");
      calcP.appendChild(inp); calcP.appendChild(out); calcP.appendChild(keys); calcP.appendChild(hist);
      function show() {
        var t = inp.value.trim();
        if (!t) { out.innerHTML = ""; return null; }
        try {
          var v = evalCalc(t), f = asFraction(v);
          out.innerHTML = '<span class="st-eq">=</span>' + m(shown(v)) + (f ? '<span class="st-calc-f">' + m("= " + f) + "</span>" : "");
          out.classList.remove("bad");
          return v;
        } catch (e) { out.innerHTML = '<span class="st-calc-err">' + esc(e.message || "Can't read that yet.") + "</span>"; out.classList.add("bad"); return null; }
      }
      inp.addEventListener("input", show);
      inp.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        var v = show();
        if (v == null) return;
        var li = el("li", null, '<span class="st-calc-hx">' + esc(inp.value) + '</span><b>' + esc(shown(v)) + "</b>");
        li.title = "Use this answer";
        li.addEventListener("click", function () { inp.value = shown(v); show(); inp.focus(); });
        hist.insertBefore(li, hist.firstChild);
        while (hist.children.length > 6) hist.lastChild.remove();
        inp.select();
      });
      focusSoon(inp);

      /* Graph: up to three curves; the points that matter found for you —
         zeros, intercepts, where two curves meet, turning points. */
      var eqs = el("div", "st-g-eqs");
      var fields = [];
      ["b", "r", "g"].forEach(function (c, i) {
        var row = el("label", "st-g-eq c-" + c);
        row.innerHTML = '<i class="st-g-sw"></i><span class="m"><i class="mv">y</i><span class="mrel">=</span></span>';
        var f = el("input");
        f.type = "text"; f.autocomplete = "off"; f.spellcheck = false;
        f.placeholder = i === 0 ? "x^2 − 4x − 5" : i === 1 ? "2x + 1" : "";
        f.setAttribute("aria-label", "Curve " + (i + 1));
        f.addEventListener("input", drawGraph);
        row.appendChild(f);
        eqs.appendChild(row);
        fields.push(f);
      });
      var gbox = el("div", "st-g-box");
      var zoom = el("div", "st-g-zoom");
      var win = { x: [-10, 10], y: [-10, 10] };
      [["−", 1.6], ["+", 1 / 1.6], ["Fit", 0]].forEach(function (z) {
        var b = button("st-key", z[0]);
        b.addEventListener("click", function () {
          if (!z[1]) { win = { x: [-10, 10], y: [-10, 10] }; fitY(); }
          else { var cx = (win.x[0] + win.x[1]) / 2, cy = (win.y[0] + win.y[1]) / 2, hx = (win.x[1] - win.x[0]) / 2 * z[1], hy = (win.y[1] - win.y[0]) / 2 * z[1]; win = { x: [cx - hx, cx + hx], y: [cy - hy, cy + hy] }; }
          drawGraph();
        });
        zoom.appendChild(b);
      });
      var read = el("p", "st-g-read", "Tap a point to read it.");
      graphP.appendChild(eqs); graphP.appendChild(gbox); graphP.appendChild(zoom); graphP.appendChild(read);
      graphP.appendChild(el("p", "st-g-tip", "<b>SAT strategy:</b> to solve an equation, graph each side as its own curve — the solutions are the x-values where they meet."));
      function fns() {
        return fields.map(function (f, i) {
          var t = f.value.trim();
          if (!t) return null;
          try { var tree = LAB.parse(calcPrep(t)); var fn = function (x) { try { return LAB.evalTree(tree, { x: x, pi: Math.PI, e: Math.E }); } catch (e) { return NaN; } }; fn(1); return { f: fn, c: ["b", "r", "g"][i], i: i }; }
          catch (e) { return { bad: true, i: i }; }
        });
      }
      function fitY() {
        var ys = [];
        fns().forEach(function (F) { if (!F || F.bad) return; for (var k = 0; k <= 60; k++) { var y = F.f(win.x[0] + (win.x[1] - win.x[0]) * k / 60); if (isFinite(y)) ys.push(y); } });
        if (!ys.length) return;
        ys.sort(function (a, b) { return a - b; });
        var lo = ys[Math.floor(ys.length * 0.05)], hi = ys[Math.floor(ys.length * 0.95)];
        lo = Math.min(lo, 0); hi = Math.max(hi, 0);
        var pad = (hi - lo) * 0.15 || 5;
        win.y = [lo - pad, hi + pad];
      }
      function roots(f, a, b) {
        var out = [], n = 800, px = a, py = f(a);
        for (var k = 1; k <= n; k++) {
          var x = a + (b - a) * k / n, y = f(x);
          if (isFinite(py) && isFinite(y)) {
            if (py === 0) out.push(px);
            else if (py * y < 0) {
              var lo = px, hi = x, flo = py;
              for (var j = 0; j < 50; j++) { var mid = (lo + hi) / 2, fm = f(mid); if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; } }
              var r = (lo + hi) / 2;
              if (Math.abs(f(r)) < 1e-6 * (1 + Math.abs(y - py) * n)) out.push(r);
            }
          }
          px = x; py = y;
        }
        return out;
      }
      function extrema(f, a, b) {
        var out = [], n = 600, h = (b - a) / n;
        for (var k = 1; k < n; k++) {
          var x = a + h * k, y0 = f(x - h), y1 = f(x), y2 = f(x + h);
          if (!isFinite(y0 + y1 + y2)) continue;
          if ((y1 > y0 && y1 > y2) || (y1 < y0 && y1 < y2)) {
            var lo = x - h, hi = x + h;
            for (var j = 0; j < 40; j++) { var m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if ((f(m1) < f(m2)) === (y1 < y0)) hi = m2; else lo = m1; }
            out.push((lo + hi) / 2);
          }
        }
        return out;
      }
      function nice(v) { var r = Math.round(v * 1000) / 1000; return Math.abs(r) < 1e-9 ? "0" : num(r).replace("-", "−"); }
      function drawGraph() {
        var F = fns(), W = 340, H = 300, pad = 8;
        function X(v) { return pad + (v - win.x[0]) / (win.x[1] - win.x[0]) * (W - 2 * pad); }
        function Y(v) { return H - pad - (v - win.y[0]) / (win.y[1] - win.y[0]) * (H - 2 * pad); }
        var P = Pic(W, H), st2 = niceStep(win.x[1] - win.x[0], 10), sy = niceStep(win.y[1] - win.y[0], 10);
        for (var gx = Math.ceil(win.x[0] / st2) * st2; gx <= win.x[1]; gx += st2) P.line(X(gx), 0, X(gx), H, "st-f-grid");
        for (var gy = Math.ceil(win.y[0] / sy) * sy; gy <= win.y[1]; gy += sy) P.line(0, Y(gy), W, Y(gy), "st-f-grid");
        if (win.y[0] < 0 && win.y[1] > 0) P.line(0, Y(0), W, Y(0), "st-f-axis");
        if (win.x[0] < 0 && win.x[1] > 0) P.line(X(0), 0, X(0), H, "st-f-axis");
        var lx = Math.ceil(win.x[0] / (st2 * 2)) * st2 * 2;
        for (; lx <= win.x[1]; lx += st2 * 2) if (Math.abs(lx) > 1e-9) P.text(X(lx), clamp(Y(0) + 13, 11, H - 3), nice(lx), { cls: "st-f-n xs" });
        var ly = Math.ceil(win.y[0] / (sy * 2)) * sy * 2;
        for (; ly <= win.y[1]; ly += sy * 2) if (Math.abs(ly) > 1e-9) P.text(clamp(X(0) - 4, 16, W - 3), Y(ly) + 4, nice(ly), { cls: "st-f-n xs", a: "end" });
        var pts = [];
        F.forEach(function (fo) {
          if (!fo || fo.bad) return;
          var d = "", pen = false, prev = null;
          for (var k = 0; k <= 500; k++) {
            var x = win.x[0] + (win.x[1] - win.x[0]) * k / 500, y = fo.f(x);
            if (!isFinite(y) || (prev != null && Math.abs(y - prev) > (win.y[1] - win.y[0]) * 2)) { pen = false; prev = isFinite(y) ? y : null; continue; }
            d += (pen ? "L" : "M") + X(x).toFixed(1) + " " + clamp(Y(y), -2000, 2000).toFixed(1); pen = true; prev = y;
          }
          P.path(d, "st-f-curve c-" + fo.c);
          roots(fo.f, win.x[0], win.x[1]).forEach(function (r) { pts.push({ x: r, y: 0, t: "zero" }); });
          var y0 = fo.f(0);
          if (isFinite(y0) && win.x[0] < 0 && win.x[1] > 0) pts.push({ x: 0, y: y0, t: "y-intercept" });
          extrema(fo.f, win.x[0], win.x[1]).forEach(function (x) { pts.push({ x: x, y: fo.f(x), t: "turning point" }); });
        });
        var live = F.filter(function (fo) { return fo && !fo.bad; });
        for (var a = 0; a < live.length; a++) for (var b = a + 1; b < live.length; b++) {
          (function (f1, f2) {
            roots(function (x) { return f1.f(x) - f2.f(x); }, win.x[0], win.x[1]).forEach(function (r) { pts.push({ x: r, y: f1.f(r), t: "intersection", hi: true }); });
          })(live[a], live[b]);
        }
        pts.forEach(function (p, k) {
          if (!isFinite(p.y) || p.y < win.y[0] || p.y > win.y[1]) return;
          P.add('<g class="st-g-poi' + (p.hi ? " hi" : "") + '" data-k="' + k + '" tabindex="0" role="button" aria-label="' + esc(p.t + " at (" + nice(p.x) + ", " + nice(p.y) + ")") + '"><circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="11" class="hit"/><circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="4.2" class="dot"/></g>');
        });
        gbox.innerHTML = P.svg("Your graph", "st-g-svg");
        [].forEach.call(gbox.querySelectorAll(".st-g-poi"), function (g) {
          function pick() {
            var p = pts[+g.dataset.k];
            [].forEach.call(gbox.querySelectorAll(".st-g-poi"), function (x) { x.classList.toggle("on", x === g); });
            read.innerHTML = "<b>" + esc(p.t.charAt(0).toUpperCase() + p.t.slice(1)) + "</b> " + m("(" + nice(p.x) + ", " + nice(p.y) + ")");
          }
          g.addEventListener("click", pick);
          g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        });
        var bad = F.filter(function (fo) { return fo && fo.bad; });
        if (bad.length) read.innerHTML = "Curve " + (bad[0].i + 1) + " can't be read yet — keep typing.";
        else if (!live.length) read.textContent = "Type an equation to graph it.";
      }
      body._draw = drawGraph;
    });
  };

  /* The reference sheet, as the SAT gives it. */
  TOOLS.ref = function () {
    return panel("ref", "Reference", function (body) {
      function card(pic, lines) {
        return '<div class="st-ref-c"><div class="st-ref-pic">' + pic + '</div><div class="st-ref-f">' + lines.map(function (l) { return m(l); }).join("<br>") + "</div></div>";
      }
      function mini(w, h, inner) { return '<svg viewBox="0 0 ' + w + " " + h + '" class="st-ref-svg" aria-hidden="true">' + inner + "</svg>"; }
      var T = function (x, y, s) { return '<text x="' + x + '" y="' + y + '" class="st-f-t sm" text-anchor="middle"><tspan font-style="italic">' + s + "</tspan></text>"; };
      body.innerHTML =
        '<div class="st-ref">' +
        card(mini(90, 70, '<circle cx="45" cy="35" r="26" class="st-f-ring"/><line x1="45" y1="35" x2="71" y2="35" class="st-f-ink"/><circle cx="45" cy="35" r="2.5" class="st-f-pt c-ink"/>' + T(58, 30, "r")), ["A = \\pi r^2", "C = 2\\pi r"]) +
        card(mini(90, 70, '<rect x="14" y="16" width="62" height="38" class="st-f-shape"/>' + T(45, 66, "ℓ") + T(84, 39, "w")), ["A = ℓw"]) +
        card(mini(90, 70, '<polygon points="10,56 80,56 56,12" class="st-f-shape"/><line x1="56" y1="12" x2="56" y2="56" class="st-f-thin dash"/>' + T(45, 68, "b") + T(62, 38, "h")), ["A = \\frac{1}{2}bh"]) +
        card(mini(90, 70, '<polygon points="14,58 76,58 76,14" class="st-f-shape"/><path d="M68 58V50h8" class="st-f-thin"/>' + T(45, 70, "a") + T(86, 38, "b") + T(38, 30, "c")), ["c^2 = a^2 + b^2"]) +
        card(mini(96, 72, '<polygon points="12,60 76,60 12,16" class="st-f-shape"/><path d="M12 52h8v8" class="st-f-thin"/>' + '<text x="44" y="70" class="st-f-t xs" text-anchor="middle">x√3</text><text x="4" y="42" class="st-f-t xs" text-anchor="middle">x</text><text x="52" y="32" class="st-f-t xs" text-anchor="middle">2x</text><text x="62" y="56" class="st-f-t xs">30°</text><text x="16" y="28" class="st-f-t xs">60°</text>'), ["\\text{special right triangles}"]) +
        card(mini(96, 72, '<polygon points="14,60 70,60 14,16" class="st-f-shape"/><path d="M14 52h8v8" class="st-f-thin"/>' + '<text x="42" y="70" class="st-f-t xs" text-anchor="middle">s</text><text x="6" y="42" class="st-f-t xs" text-anchor="middle">s</text><text x="50" y="34" class="st-f-t xs" text-anchor="middle">s√2</text><text x="52" y="56" class="st-f-t xs">45°</text><text x="18" y="30" class="st-f-t xs">45°</text>'), ["\\text{45°–45°–90°}"]) +
        card(mini(90, 70, '<polygon points="16,26 58,26 58,60 16,60" class="st-f-shape"/><polygon points="16,26 32,12 74,12 58,26" class="st-f-shape soft"/><polygon points="58,26 74,12 74,46 58,60" class="st-f-shape soft2"/>'), ["V = ℓwh"]) +
        card(mini(90, 70, '<path d="M24 14V56A21 7 0 0 0 66 56V14" class="st-f-shape"/><ellipse cx="45" cy="14" rx="21" ry="7" class="st-f-shape soft"/>' + T(76, 40, "h") + T(55, 52, "r")), ["V = \\pi r^2 h"]) +
        card(mini(90, 70, '<circle cx="45" cy="35" r="26" class="st-f-ring"/><ellipse cx="45" cy="35" rx="26" ry="7" class="st-f-thin dash"/>' + T(58, 30, "r")), ["V = \\frac{4}{3}\\pi r^3"]) +
        card(mini(90, 70, '<path d="M22 58L45 12L68 58A23 7 0 0 1 22 58" class="st-f-shape"/>' + T(78, 40, "h")), ["V = \\frac{1}{3}\\pi r^2 h"]) +
        card(mini(90, 70, '<polygon points="18,58 62,58 76,46 45,10" class="st-f-shape"/><path d="M18 58L32 46H76" class="st-f-thin dash"/><path d="M32 46L45 10" class="st-f-thin dash"/>'), ["V = \\frac{1}{3}ℓwh"]) +
        "</div>" +
        '<ul class="st-ref-facts"><li>The number of degrees of arc in a circle is 360.</li><li>The number of radians of arc in a circle is ' + m("2\\pi") + ".</li><li>The sum of the measures in degrees of the angles of a triangle is 180.</li></ul>";
    });
  };

  /* ============================================================= Sessions
     Today's mission, "I have 10 minutes", an 8-minute fix for one skill, a
     strategy tried out — each is a short plan of blocks, grouped the way the
     student is told about them ("3 min — review your quadratics mistake"),
     and played one after another with the plan in view the whole time.

       block { k: "lesson", id }                      the idea, in the lab player
             { k: "q", id, diff, form, guided, timed, review: log entry,
               transfer, label }                       one question, coached */
  var PAGE = null;   // the page being shown, so a finished session can go home
  function pageTop(host, ctx, title, o) {
    o = o || {};
    host.innerHTML = "";
    var page = el("div", "st-root st-page" + (o.cls ? " " + o.cls : ""));
    var top = el("header", "st-ptop");
    var back = button("st-back", icon(I.back) + "<span>SAT Math</span>");
    back.addEventListener("click", function () { TOOLS.close(); ctx.go.hub(); });
    top.appendChild(back);
    if (title) top.appendChild(el("div", "st-ptitle", title));
    page.appendChild(top);
    host.appendChild(page);
    return page;
  }
  SAT.pageTop = pageTop;

  function stageBefore() {
    var o = {};
    ORDER.forEach(function (id) { o[id] = { u: understanding(id), st: stage(id), tested: tested(id) }; });
    return o;
  }

  function runSession(host, ctx, plan) {
    var page = pageTop(host, ctx, null, { cls: "st-sess" });
    var top = page.querySelector(".st-ptop");
    var tt = el("div", "st-sess-t", '<span class="st-eyebrow">' + esc(plan.eyebrow || "Session") + "</span><b>" + esc(plan.title) + "</b>");
    top.appendChild(tt);
    var clock = el("div", "st-sess-clock", '<b>0:00</b><span>of ' + mmss((plan.mins || 10) * 60) + "</span>");
    top.appendChild(clock);
    var groups = el("ol", "st-sess-g");
    (plan.groups || []).forEach(function (g, i) {
      var li = el("li", null, '<span class="st-g-dot">' + (i + 1) + '</span><span class="st-g-t"><b>' + esc(g.t) + "</b><i>" + (g.mins ? g.mins + " min" : "") + "</i></span>");
      groups.appendChild(li);
    });
    page.appendChild(groups);
    if (plan.goal) page.appendChild(el("p", "st-sess-goal", icon(I.target) + "<span><b>Today's goal:</b> " + esc(plan.goal) + "</span>"));
    var stage2 = el("div", "st-sess-stage");
    page.appendChild(stage2);
    var t0 = Date.now(), blocks = plan.blocks.slice(), ix = -1, results = [], before = stageBefore(), current = null;
    var tick = setInterval(function () {
      if (!page.isConnected) { clearInterval(tick); return; }
      clock.querySelector("b").textContent = mmss((Date.now() - t0) / 1000);
    }, 1000);
    function paintGroups() {
      var b = blocks[ix], g = b ? b.group : -1;
      [].forEach.call(groups.children, function (li, i) {
        var done = blocks.slice(0, Math.max(0, ix)).some(function (x) { return x.group === i; }) && !blocks.slice(ix).some(function (x) { return x.group === i; });
        li.className = (i === g ? "cur" : "") + (done || (ix >= blocks.length) ? " done" : "");
      });
    }
    function next() {
      if (current && current.destroy) current.destroy();
      current = null;
      ix++;
      paintGroups();
      toTop();
      if (ix >= blocks.length) { finish(); return; }
      var b = blocks[ix];
      stage2.innerHTML = "";
      if (b.k === "lesson") playLesson(b);
      else playQ(b);
    }
    function playLesson(b) {
      var sk = SK[b.id];
      var wrap = el("div", "st-lessonhost");
      stage2.appendChild(wrap);
      var steps = (sk.lesson || []).map(function (s, i) { var x = LAB.fmtStep(s); x.id = "sat-learn:" + sk.id + ":" + i; return x; });
      if (!steps.length) { next(); return; }
      CH.play(wrap, {
        path: { eyebrow: "Learn · " + DOMAINS[sk.domain].t, title: sk.t, steps: steps },
        me: ctx.me, record: false, fresh: true,
        summary: function (card) {
          lessonSeen(sk.id);
          card.appendChild(el("div", "ch-endmark", '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="m16 27 7 7 13-15"/></svg>'));
          card.appendChild(el("h2", "ch-endh", "You've got the idea."));
          card.appendChild(el("p", "ch-endsum", "Now use it — the questions start easy and get less familiar."));
          var acts = el("div", "ch-endacts");
          var go = button("ch-btn primary", "<span>Keep going</span>" + icon(I.arrow));
          go.addEventListener("click", next);
          acts.appendChild(go);
          card.appendChild(acts);
        }
      });
    }
    function playQ(b) {
      var it = b.review ? itemOf(b.review) : makeItem(b.id, b.seed || seedNow(), { diff: b.diff || 2, form: b.form });
      if (!it) { next(); return; }
      var sk = SK[it.skill];
      if (b.label) stage2.appendChild(el("p", "st-blabel" + (b.transfer ? " mask" : ""), (b.transfer ? icon(I.mask) : b.timed ? icon(I.timer) : b.guided ? icon(I.chat) : b.review ? icon(I.loop) : icon(I.bolt)) + "<span>" + esc(b.label) + "</span>"));
      var qn = blocks.slice(0, ix + 1).filter(function (x) { return x.k === "q"; }).length, qt = blocks.filter(function (x) { return x.k === "q"; }).length;
      current = qcard(it, {
        mode: "coach", n: qn, total: qt, label: "Question", guided: !!b.guided, recog: !!b.recog,
        // A question that asks what kind it is can't have its name on it.
        chip: plan.chip === false || b.recog ? null : (plan.focus ? sk.short || sk.t : null),
        socratic: prefs().socratic,
        onLocked: function (res) {
          var r = record({ k: it.skill, s: it.seed, d: it.diff, f: it.form, ok: res.ok, c: res.conf, t: res.t, ch: res.ch, tr: res.tr, eg: res.eg,
                           p: it.type === "mc" ? res.picked : res.text, m: "coach", help: res.help || b.guided, guided: !!b.guided, target: b.timed ? it.secs : it.secs * 1.15, review: !!b.due });
          // Worked through again with the coach: the old miss is taken apart.
          if (b.review) markReviewed(b.review);
          results.push({ k: it.skill, ok: res.ok, t: res.t, help: res.help || b.guided });
          return r.entry;
        },
        onTransfer: function () {
          var forms = sk.forms.filter(function (f) { return f !== it.form; });
          blocks.splice(ix + 1, 0, { k: "q", id: it.skill, diff: Math.max(1, it.diff), form: forms.length ? forms[results.length % forms.length] : it.form,
                                      transfer: true, group: b.group, label: "Same idea, different disguise: " + (FORMS[forms[results.length % Math.max(1, forms.length)]] || FORMS[it.form]).t });
        },
        onNext: next,
        nextLabel: ix + 1 >= blocks.length ? "Finish" : "Next"
      });
      stage2.appendChild(current.el);
      current.focus();
    }
    function finish() {
      clearInterval(tick);
      TOOLS.close();
      var mins = Math.max(1, Math.round((Date.now() - t0) / 60000));
      if (plan.kind === "mission") {
        var D = REC.days[dayKey()] || (REC.days[dayKey()] = { q: 0, s: 0, m: 0 });
        D.m = 1;
        REC.mission = { at: Date.now(), day: dayKey(), mins: plan.mins };
        changed();
      }
      stage2.innerHTML = "";
      var card = el("article", "st-card st-sum" + (reduced() ? "" : " in"));
      var right = results.filter(function (r) { return r.ok && !r.help; }).length;
      card.innerHTML = '<div class="st-sum-mark">' + icon(plan.kind === "mission" ? I.flame : I.check) + "</div>" +
        "<h2>" + esc(plan.kind === "mission" ? "Mission complete." : plan.kind === "fix" ? "One skill, stronger." : "Session done.") + "</h2>" +
        '<p class="st-sum-line">' + plural(results.length, "question") + " · " + right + " right on your own · " + plural(mins, "minute") +
        (plan.kind === "mission" ? " · " + plural(streak(), "day") + " in a row" : "") + "</p>";
      var touched = {};
      results.forEach(function (r) { touched[r.k] = 1; });
      var list = el("div", "st-sum-skills");
      Object.keys(touched).forEach(function (id) {
        var b0 = before[id], u1 = pct(understanding(id)), u0 = b0.tested ? pct(b0.u) : null, s1 = stage(id);
        var row = el("div", "st-sum-sk");
        row.innerHTML = '<div class="st-sum-n"><b>' + esc(SK[id].t) + "</b><span>" + esc(DOMAINS[SK[id].domain].t) + "</span></div>" +
          '<div class="st-sum-u"><span class="st-sum-from">' + (u0 == null ? "new" : u0 + "%") + '</span>' + icon(I.arrow) + '<b class="st-sum-to">' + u1 + "%</b></div>" +
          loopPips(s1, b0.st);
        list.appendChild(row);
        if (u0 != null) countUp(row.querySelector(".st-sum-to"), u0, u1, 1100, "%");
        if (s1 > b0.st) row.appendChild(el("p", "st-sum-stage", icon(I.trend) + "<span>New stage: <b>" + esc(STAGES[s1].t) + "</b> — " + esc(stageNext(s1)) + "</span>"));
      });
      card.appendChild(list);
      var acts = el("div", "st-acts");
      var home = button("st-btn primary", "<span>Back to your SAT plan</span>" + icon(I.arrow));
      home.addEventListener("click", function () { ctx.go.hub(); });
      var again = null;
      if (plan.again) { again = button("st-btn", "<span>" + esc(plan.again.t) + "</span>"); again.addEventListener("click", plan.again.go); acts.appendChild(again); }
      acts.appendChild(home);
      card.appendChild(acts);
      stage2.appendChild(card);
      focusSoon(home);
    }
    next();
  }
  SAT.runSession = runSession;
  function stageNext(st) {
    return ["start with the lesson — meet the idea, then the coach walks you through one.", "next, answer one with the coach beside you.", "next, get one right with no help.", "next, solve it in two new disguises.",
            "next, beat the clock on one.", "we'll bring it back in a day or two to check it stuck.", "one more check in a few days and it's mastered.", "it's yours."][st] || "";
  }
  /* The mastery loop as seven small segments. */
  function loopPips(st, was) {
    var h = '<span class="st-loop" aria-label="Mastery loop: ' + esc(STAGES[st].t) + '">';
    for (var i = 1; i <= 7; i++) h += '<i class="' + (i <= st ? "on" : "") + (was != null && i > was && i <= st ? " new" : "") + '" title="' + esc(STAGES[i].t) + '"></i>';
    return h + "</span>";
  }
  SAT.loopPips = loopPips;

  /* ============================================================ Planning
     What to do with the minutes a student has. It always starts with what
     they got wrong last (the freshest lesson there is), spends most of the
     time on the biggest opportunity, and ends on something from before, so
     yesterday's work isn't lost. */
  function opportunity(skip) {
    var ids = ORDER.filter(function (id) { return !skip || skip.indexOf(id) < 0; });
    if (!ids.length) return null;
    var best = null;
    ids.forEach(function (id) {
      var g = gain(id) * (tested(id) ? 1 : 0.8) * (stage(id) >= 7 ? 0.2 : 1);
      if (!best || g > best.g) best = { id: id, g: g };
    });
    return best ? best.id : ids[0];
  }
  SAT.opportunity = opportunity;
  function whyOpportunity(id) {
    var s = REC.sk[id], log = REC.log.filter(function (x) { return x.k === id; });
    if (!s || !log.length) return "You haven't met this one yet — and it's worth a lot of points.";
    var byForm = {};
    log.forEach(function (x) { var f = byForm[x.f] || (byForm[x.f] = { n: 0, ok: 0 }); f.n++; if (x.ok) f.ok++; });
    var prim = SK[id].forms[0], p = byForm[prim], others = Object.keys(byForm).filter(function (f) { return f !== prim; });
    var oRate = others.reduce(function (a, f) { return a + byForm[f].ok; }, 0) / Math.max(1, others.reduce(function (a, f) { return a + byForm[f].n; }, 0));
    var slips = log.filter(function (x) { return !x.ok && (x.e === "calc"); }).length, slow = log.filter(function (x) { return x.tg && x.t > 1.5 * x.tg; }).length;
    var misses2 = log.filter(function (x) { return !x.ok; }).length;
    if (p && p.ok / p.n >= 0.6 && others.length && oRate < 0.5) return "You're getting the idea, but losing points when the question changes form.";
    if (slips >= 2 && slips >= misses2 / 2) return "You know how to do it — small slips are costing you. Estimate first, then check.";
    if (slow >= 2 && slow >= log.length / 2) return "You get there, but slowly. There's a faster way in.";
    if (understanding(id) < 0.45) return "The core idea isn't solid yet. Eight minutes on it will change that.";
    return "Close to solid — a few more in different disguises will lock it in.";
  }
  SAT.whyOpportunity = whyOpportunity;
  function yesterdaySkill(skip) {
    var today = dayKey();
    for (var i = REC.log.length - 1; i >= 0; i--) {
      var x = REC.log[i];
      if (dayKey(x.at) !== today && SK[x.k] && (!skip || skip.indexOf(x.k) < 0)) return x.k;
    }
    return null;
  }
  function openMiss(skip) {
    for (var i = REC.log.length - 1; i >= 0; i--) {
      var x = REC.log[i];
      if (!x.ok && !x.rv && SK[x.k] && (!skip || skip.indexOf(x.k) < 0)) return x;
    }
    return null;
  }
  function dueSkills() { return ORDER.filter(function (id) { return due(id); }); }
  function nextForm(id, k) { var f = SK[id].forms; return f[k % f.length]; }

  function buildPlan(mins, o) {
    o = o || {};
    var focus = o.focus || opportunity(), sk = SK[focus], groups = [], blocks = [], st = stage(focus);
    function group(t, m2) { groups.push({ t: t, mins: m2 }); return groups.length - 1; }
    var miss = openMiss(), yest = yesterdaySkill([focus]), dues = dueSkills().filter(function (id) { return id !== focus; });
    var d0 = understanding(focus) < 0.5 ? 1 : 2;
    if (mins <= 5) {
      if (miss) blocks.push({ k: "q", review: miss, id: miss.k, group: group("Redo your last miss", 2), label: "Your " + SK[miss.k].short + " miss, one more time" });
      else if (dues.length) blocks.push({ k: "q", id: dues[0], diff: 2, due: true, group: group("Quick recall: " + SK[dues[0]].short, 1), label: "Spaced review" });
      var g1 = group(sk.short + ": two quick ones", 3);
      blocks.push({ k: "q", id: focus, diff: d0, form: nextForm(focus, 0), guided: st < 2, group: g1, label: st < 2 ? "Guided" : "On your own" });
      blocks.push({ k: "q", id: focus, diff: 2, form: nextForm(focus, 1), group: g1, label: "Different disguise", transfer: true });
    } else if (mins <= 10) {
      if (miss) blocks.push({ k: "q", review: miss, id: miss.k, group: group("Review your " + SK[miss.k].short + " mistake", 2), label: "The one that got away" });
      var gl = group(st < 1 ? "Learn: " + sk.short : "Warm up: " + sk.short, 3);
      if (st < 1) blocks.push({ k: "lesson", id: focus, group: gl });
      else blocks.push({ k: "q", id: focus, diff: d0, form: nextForm(focus, 0), guided: st < 2, group: gl, label: st < 2 ? "Guided" : "Warm up" });
      var g2 = group("Targeted practice", 4);
      [0, 1, 2].forEach(function (k) { blocks.push({ k: "q", id: focus, diff: k === 0 ? d0 : 2, form: nextForm(focus, k), group: g2, label: "Targeted · " + FORMS[nextForm(focus, k)].t }); });
      blocks.push({ k: "q", id: focus, diff: 2, form: nextForm(focus, 3), transfer: true, recog: true, group: group("Transfer challenge", 1), label: "Transfer: can you still spot it?" });
    } else {
      if (miss) blocks.push({ k: "q", review: miss, id: miss.k, group: group("Review your " + SK[miss.k].short + " mistake", 3), label: "The one that got away" });
      var gL = group("Learn one concept: " + sk.short, 5);
      if (st < 1 || understanding(focus) < 0.6) blocks.push({ k: "lesson", id: focus, group: gL });
      blocks.push({ k: "q", id: focus, diff: d0, form: nextForm(focus, 0), guided: true, group: gL, label: "Guided" });
      var gT = group("Solve 4 targeted questions", 5);
      [0, 1, 2, 3].forEach(function (k) { blocks.push({ k: "q", id: focus, diff: k < 1 ? d0 : k < 3 ? 2 : 3, form: nextForm(focus, k), group: gT, label: "Targeted · " + FORMS[nextForm(focus, k)].t, timed: k === 3 }); });
      var gX = group("Transfer challenge", 3);
      var fs = sk.forms.slice(1).concat(sk.forms.slice(0, 1));
      [0, 1].forEach(function (k) { blocks.push({ k: "q", id: focus, diff: 2, form: fs[k % fs.length], transfer: true, recog: k === 1, group: gX, label: "Different disguise: " + FORMS[fs[k % fs.length]].t }); });
      var rec = dues[0] || yest;
      if (rec) blocks.push({ k: "q", id: rec, diff: 2, due: due(rec), recog: true, group: group("Recall: " + SK[rec].short, 2), label: "From before — does it still stick?" });
      if (mins >= 45) {
        var second = opportunity([focus]), gS = group("Second skill: " + SK[second].short, 10);
        blocks.push({ k: "q", id: second, diff: 1, guided: stage(second) < 2, group: gS, label: "Guided" });
        [0, 1, 2].forEach(function (k) { blocks.push({ k: "q", id: second, diff: 2, form: nextForm(second, k), group: gS, label: FORMS[nextForm(second, k)].t }); });
        var gM = group("Timed mixed set", 10), mix = [0, 1, 2, 3, 4, 5].map(function (k) { return ORDER[(k * 7 + REC.log.length) % ORDER.length]; });
        mix.forEach(function (id, k) { blocks.push({ k: "q", id: id, diff: 2, timed: true, recog: k % 2 === 0, group: gM, label: "Mixed · against the clock" }); });
      }
    }
    var cur = pct(understanding(focus));
    return { kind: o.kind || "time", mins: mins, eyebrow: o.eyebrow || "I have " + mins + " minutes", title: o.title || sk.t, groups: groups, blocks: blocks,
             focus: focus, goal: tested(focus) ? "Turn " + sk.short + ": " + cur + "% → " + Math.min(95, Math.round((cur + (mins >= 20 ? 17 : 10)) / 5) * 5) + "%" : "Meet " + sk.short + " and get it working" };
  }
  SAT.buildPlan = buildPlan;
  function fixPlan(id) {
    var sk = SK[id], st = stage(id), groups = [], blocks = [];
    function group(t, m2) { groups.push({ t: t, mins: m2 }); return groups.length - 1; }
    var g0 = group("Learn", 2), g1 = group("Guided", 1), g2 = group("On your own", 1), g3 = group("Different disguise", 2), g4 = group("Against the clock", 2);
    blocks.push({ k: "lesson", id: id, group: g0 });
    blocks.push({ k: "q", id: id, diff: 1, form: sk.forms[0], guided: true, group: g1, label: "Guided — the coach asks, you answer" });
    blocks.push({ k: "q", id: id, diff: 2, form: sk.forms[0], group: g2, label: "On your own" });
    var others = sk.forms.slice(1);
    [0, 1].forEach(function (k) { var f = others.length ? others[k % others.length] : sk.forms[0]; blocks.push({ k: "q", id: id, diff: 2, form: f, group: g3, label: "Different disguise: " + FORMS[f].t, transfer: true }); });
    blocks.push({ k: "q", id: id, diff: st >= 4 ? 3 : 2, group: g4, timed: true, label: "Timed — aim to beat the clock" });
    void st;
    return { kind: "fix", mins: 8, eyebrow: "Fix this skill · 8 min", title: sk.t, groups: groups, blocks: blocks, focus: id,
             goal: tested(id) ? "Turn " + sk.short + ": " + pct(understanding(id)) + "% → " + Math.min(95, Math.round((pct(understanding(id)) + 15) / 5) * 5) + "%" : null };
  }
  SAT.fixPlan = fixPlan;

  /* ========================================================== Brain scan
     Every skill once, interleaved across the domains, easier or harder as it
     goes the way the real test's second module is. No marks until the end;
     a confidence tap on every answer; a few "what kind of question is
     this?" along the way. The full scan then asks three more, where the
     answers left the most doubt. It survives a refresh. */
  function scanPlan(kind) {
    var per = kind === "quick" ? { 1: 4, 2: 4, 3: 2, 4: 2 } : null;
    var queues = {};
    [1, 2, 3, 4].forEach(function (n) { var ids = skillsIn(n); queues[n] = per ? ids.slice(0, per[n]) : ids.slice(); });
    var order = [], pattern = [1, 2, 3, 1, 2, 4];
    for (var guard = 0; guard < 200 && [1, 2, 3, 4].some(function (n) { return queues[n].length; }); guard++) {
      var n2 = pattern[guard % pattern.length];
      if (!queues[n2].length) n2 = [1, 2, 3, 4].filter(function (k) { return queues[k].length; })[0];
      order.push(queues[n2].shift());
    }
    return order;
  }
  function runScan(host, ctx, kind) {
    var run = REC.scanRun && REC.scanRun.kind === kind && REC.scanRun.i < REC.scanRun.plan.length + (kind === "quick" ? 0 : 3) ? REC.scanRun : null;
    if (!run) {
      run = REC.scanRun = { kind: kind, plan: scanPlan(kind), i: 0, ans: [], dd: {}, at: Date.now(), t: 0, seed: seedNow() };
      changed();
    }
    var extra = kind === "quick" ? 0 : 3, total = run.plan.length + extra;
    var page = pageTop(host, ctx, null, { cls: "st-scan" });
    var top = page.querySelector(".st-ptop");
    top.appendChild(el("div", "st-sess-t", '<span class="st-eyebrow">' + icon(I.brain) + "SAT Brain Scan</span><b>" + (kind === "quick" ? "Quick scan" : "Full scan") + "</b>"));
    var clock = el("div", "st-sess-clock", "<b>" + mmss(run.t) + "</b><span>no rush</span>");
    top.appendChild(clock);
    var bar = el("div", "st-scanbar");
    for (var i = 0; i < total; i++) bar.appendChild(el("i"));
    page.appendChild(bar);
    var stage2 = el("div", "st-sess-stage");
    page.appendChild(stage2);
    var current = null, tStart = Date.now() - run.t * 1000;
    var tick = setInterval(function () {
      if (!page.isConnected) { clearInterval(tick); return; }
      clock.querySelector("b").textContent = mmss((Date.now() - tStart) / 1000);
    }, 1000);
    function paintBar() {
      [].forEach.call(bar.children, function (b, k) {
        var a = run.ans[k], id = k < run.plan.length ? run.plan[k] : a && a.k;
        b.className = (id && SK[id] ? DOMAINS[SK[id].domain].cls : "") + (k < run.i ? " done" : k === run.i ? " cur" : "");
      });
    }
    function followUps() {
      // Where the scan is least sure: wrong but certain, right but guessing.
      var scored = run.ans.map(function (a) { return { k: a.k, s: (a.ok ? (a.c <= 1 ? 2 : 0) : (a.c >= 2 ? 3 : 1)) + (a.d === 2 ? 0.5 : 0), d: a.ok ? 3 : 1 }; });
      scored.sort(function (a, b) { return b.s - a.s; });
      var seen = {}, out = [];
      scored.forEach(function (x) { if (out.length < 3 && !seen[x.k]) { seen[x.k] = 1; out.push(x); } });
      return out;
    }
    function nextQ() {
      if (current && current.destroy) current.destroy();
      run.t = (Date.now() - tStart) / 1000;
      if (run.i >= total) { finish(); return; }
      paintBar();
      toTop();
      var id, d, form;
      if (run.i < run.plan.length) {
        id = run.plan[run.i];
        var dom = SK[id].domain;
        d = run.i === 0 ? 1 : run.dd[dom] || 2;
        form = SK[id].forms[(run.i + dom) % SK[id].forms.length];
      } else {
        if (!run.fu) { run.fu = followUps(); changed(); }
        var f = run.fu[run.i - run.plan.length];
        id = f.k; d = f.d; form = SK[id].forms[(run.i + 1) % SK[id].forms.length];
      }
      var it = makeItem(id, run.seed + ":" + run.i, { diff: d, form: form });
      stage2.innerHTML = "";
      var recog = [2, 8, 14, 20].indexOf(run.i) > -1;
      current = qcard(it, {
        mode: "scan", n: run.i + 1, total: total, recog: recog,
        onRecog: function (ok) { run.rg = (run.rg || 0) + (ok ? 1 : 0); run.rn = (run.rn || 0) + 1; },
        onLocked: function (res) {
          var r = record({ k: it.skill, s: it.seed, d: it.diff, f: it.form, ok: res.ok, c: res.conf, t: res.t, ch: res.ch, tr: res.tr, eg: res.eg, m: "scan", target: it.secs,
                           p: res.skipped ? null : it.type === "mc" ? res.picked : res.text });
          run.ans.push({ k: it.skill, ok: res.ok ? 1 : 0, c: res.conf, d: it.diff, t: Math.round(res.t) });
          var dom2 = SK[it.skill].domain;
          run.dd[dom2] = clamp((run.dd[dom2] || 2) + (res.ok ? 1 : -1), 1, 3);
          run.i++;
          changed();
          setTimeout(nextQ, reduced() ? 0 : 280);
          return r.entry;
        }
      });
      stage2.appendChild(current.el);
      if (run.i === 0) stage2.insertBefore(el("p", "st-scan-note", icon(I.bulb) + "<span>No marks until the end. Choose an answer, then tap how sure you are — that locks it in. Keys work too: <b>A–D</b> to choose, <b>1–4</b> for how sure.</span>"), current.el);
      current.focus();
    }
    function finish() {
      clearInterval(tick);
      TOOLS.close();
      var right = run.ans.filter(function (a) { return a.ok; }).length;
      var est = estimate();
      REC.scan = { at: Date.now(), kind: kind, n: run.ans.length, right: right, t: Math.round(run.t), score: est ? est.score : null, lo: est ? est.lo : null, hi: est ? est.hi : null,
                   rg: run.rg || 0, rn: run.rn || 0 };
      REC.scanRun = null;
      changed();
      reveal(host, ctx, true);
    }
    nextQ();
  }
  SAT.runScan = runScan;

  /* =============================================================== Module
     A timed module the way the digital SAT runs one: 22 questions in 35
     minutes, Algebra and Advanced Math most of it, easier questions first.
     Move freely, flag a question to come back to, cross choices out, open
     the question map, review before submitting. The full section is two
     modules, the second harder or easier depending on the first — as the
     real one adapts.

     After it: the score it points to, and the Pacing Coach — where the time
     went, which long questions cost points that shorter ones were waiting
     to give, and the answers changed from right to wrong. */
  var MOD_MIX = { 1: 8, 2: 8, 3: 3, 4: 3 };
  var MOD_DIFF = { mid: [7, 8, 7], hard: [3, 8, 11], easy: [10, 8, 4] };
  function modulePlan(seed, level) {
    var R = LAB.rng(seed), diffs = [], qs = [], mix = MOD_DIFF[level || "mid"];
    [1, 2, 3].forEach(function (d) { for (var i = 0; i < mix[d - 1]; i++) diffs.push(d); });
    diffs = R.shuffle(diffs);
    var k = 0;
    [1, 2, 3, 4].forEach(function (n) {
      var ids = R.shuffle(skillsIn(n));
      for (var i = 0; i < MOD_MIX[n]; i++) {
        var id = ids[i % ids.length];
        qs.push({ id: id, d: diffs[k++], form: R.pick(SK[id].forms), seed: seed + ":" + k });
      }
    });
    // Easier first, as the real modules run; mixed within a level.
    qs = R.shuffle(qs).sort(function (a, b) { return a.d - b.d; });
    return qs;
  }
  function runModule(host, ctx, kind) {
    var full = kind === "full", seed = seedNow();
    var mods = [{ n: 1, plan: modulePlan(seed + "m1", "mid") }];
    var page = pageTop(host, ctx, null, { cls: "st-mod" });
    var state = null;
    intro();
    function intro() {
      page.querySelector(".st-ptop").appendChild(el("div", "st-ptitle", full ? "Full Math section" : "Math module"));
      var card = el("article", "st-card st-mod-intro" + (reduced() ? "" : " in"));
      card.innerHTML = '<div class="st-mod-ic">' + icon(I.timer) + "</div>" +
        "<h2>" + (full ? "Two modules · 44 questions · 70 minutes" : "One module · 22 questions · 35 minutes") + "</h2>" +
        '<p class="st-lede">Just like test day. ' + (full ? "Module 2 adapts to how Module 1 went. " : "") +
        "No marks until the end — then the Pacing Coach shows where your time went.</p>" +
        '<ul class="st-mod-rules"><li>' + icon(I.flag) + "<span><b>Mark for review</b> any question to come back to. Every question is worth the same — don't let one eat your time.</span></li>" +
        "<li>" + icon(I.strike) + "<span><b>Cross out</b> choices you've ruled out: the small letter at the right of each choice.</span></li>" +
        "<li>" + icon(I.calc) + "<span><b>Calculator and reference sheet</b> are open for every question.</span></li>" +
        "<li>" + icon(I.grid) + "<span><b>The question map</b> at the bottom jumps anywhere. Unanswered questions count as wrong — always put something.</span></li></ul>";
      var go = button("st-btn primary lg", "<span>Start the clock</span>" + icon(I.arrow));
      go.addEventListener("click", function () { card.remove(); start(0); });
      card.appendChild(go);
      page.appendChild(card);
      focusSoon(go);
    }
    function start(mi) {
      var M = mods[mi];
      M.items = M.plan.map(function (q) { return makeItem(q.id, q.seed, { diff: q.d, form: q.form }); }).filter(Boolean);
      M.ans = M.items.map(function () { return { a: null, first: null, flag: false, t: 0, strikes: {}, ch: 0 }; });
      state = { M: M, mi: mi, ix: 0, left: 35 * 60, t0: Date.now(), warned: false };
      page.innerHTML = "";
      var bar = el("header", "st-mod-top");
      bar.innerHTML = '<div class="st-mod-name"><b>Module ' + M.n + "</b><span>Math</span></div>";
      var timer = button("st-mod-timer", "<b>35:00</b>");
      timer.title = "Hide the timer";
      var hidden = false;
      timer.addEventListener("click", function () { hidden = !hidden; timer.classList.toggle("off", hidden); timer.title = hidden ? "Show the timer" : "Hide the timer"; });
      bar.appendChild(timer);
      var tools = el("div", "st-mod-tools");
      var cb = button("st-tb", icon(I.calc) + "<span>Calculator</span>"); cb.addEventListener("click", function () { TOOLS.calc(); });
      var rb = button("st-tb", icon(I.ref) + "<span>Reference</span>"); rb.addEventListener("click", function () { TOOLS.ref(); });
      tools.appendChild(cb); tools.appendChild(rb);
      bar.appendChild(tools);
      page.appendChild(bar);
      var stageM = el("div", "st-mod-stage");
      page.appendChild(stageM);
      var foot = el("footer", "st-mod-foot");
      var mapB = button("st-mod-mapb", "<span>Question <b>1</b> of " + M.items.length + "</span>" + icon(I.up));
      var backB = button("st-btn", "Back"), nextB = button("st-btn primary", "Next");
      var mapEl = el("div", "st-mod-map");
      mapEl.hidden = true;
      foot.appendChild(mapB);
      var nav = el("div", "st-mod-nav"); nav.appendChild(backB); nav.appendChild(nextB);
      foot.appendChild(nav);
      page.appendChild(mapEl);
      page.appendChild(foot);
      state.els = { stage: stageM, mapB: mapB, backB: backB, nextB: nextB, map: mapEl, timer: timer };
      mapB.addEventListener("click", function () { mapEl.hidden = !mapEl.hidden; if (!mapEl.hidden) paintMap(); });
      backB.addEventListener("click", function () { if (state.inReview) show(state.ix); else go(state.ix - 1); });
      nextB.addEventListener("click", function () { if (state.inReview) return; if (state.ix >= M.items.length - 1) reviewPage(); else go(state.ix + 1); });
      state.tick = setInterval(function () {
        if (!page.isConnected) { clearInterval(state.tick); return; }
        var left = Math.max(0, 35 * 60 - (Date.now() - state.t0) / 1000);
        timer.querySelector("b").textContent = mmss(left);
        timer.classList.toggle("low", left < 300);
        if (left < 300 && !state.warned) { state.warned = true; toast("Five minutes left. Answer everything — a blank is always wrong."); }
        if (left <= 0) { clearInterval(state.tick); toast("Time. Your answers are in."); submit(); }
      }, 500);
      show(0);
    }
    var card = null, shownAt = 0;
    function saveCurrent() {
      if (!card) return;
      var A = state.M.ans[state.ix];
      A.t += (Date.now() - shownAt) / 1000;
      var a = card.answer();
      if (a != null && a !== "") {
        if (A.first == null) A.first = a;
        if (A.a != null && A.a !== a) A.ch++;
        A.a = a;
      }
      A.strikes = Object.assign({}, card.strikes());
      if (card.destroy) card.destroy();
      card = null;
    }
    function show(i) {
      var M = state.M, it = M.items[i], A = M.ans[i];
      state.ix = i;
      state.inReview = false;
      state.els.nextB.disabled = false;
      state.els.stage.innerHTML = "";
      card = qcard(it, { mode: "module", n: i + 1, total: M.items.length, flagged: A.flag, clock: false,
                         onFlag: function (on) { A.flag = on; }, onEnter: function () { state.els.nextB.click(); } });
      card.restore(A.a);
      card.strikes(A.strikes);
      shownAt = Date.now();
      state.els.stage.appendChild(card.el);
      state.els.mapB.querySelector("b").textContent = i + 1;
      state.els.backB.disabled = i === 0;
      state.els.nextB.textContent = i >= M.items.length - 1 ? "Review" : "Next";
      if (!state.els.map.hidden) paintMap();
      toTop();
    }
    function go(i) {
      if (i < 0 || i >= state.M.items.length) return;
      saveCurrent();
      show(i);
    }
    function paintMap() {
      var M = state.M, g = state.els.map;
      g.innerHTML = '<div class="st-mod-map-h"><b>Module ' + M.n + ' questions</b><span><i class="k-cur"></i>Current <i class="k-ans"></i>Answered <i class="k-un"></i>Unanswered ' + icon(I.flag) + "For review</span></div>";
      var grid = el("div", "st-mod-grid");
      M.items.forEach(function (it, k) {
        var A = M.ans[k], answered = k === state.ix && card ? card.answer() != null && card.answer() !== "" : A.a != null && A.a !== "";
        var b = button("st-mod-q" + (answered ? " ans" : "") + (k === state.ix ? " cur" : "") + ((k === state.ix && card ? card.state.flag : A.flag) ? " flag" : ""), String(k + 1));
        b.addEventListener("click", function () { state.els.map.hidden = true; go(k); });
        grid.appendChild(b);
      });
      g.appendChild(grid);
      var rv = button("st-btn sm", "Go to review page");
      rv.addEventListener("click", function () { state.els.map.hidden = true; reviewPage(); });
      g.appendChild(rv);
    }
    function reviewPage() {
      saveCurrent();
      var M = state.M;
      state.els.stage.innerHTML = "";
      state.els.map.hidden = true;
      var un = M.ans.filter(function (A) { return A.a == null || A.a === ""; }).length, fl = M.ans.filter(function (A) { return A.flag; }).length;
      var box = el("article", "st-card st-mod-review");
      box.innerHTML = "<h2>Check your work</h2><p class='st-lede'>" + (un ? "<b>" + plural(un, "question") + " still blank.</b> A blank is always wrong — a guess might not be. " : "Every question has an answer. ") +
        (fl ? plural(fl, "question") + " marked for review." : "") + " You can still go back to any of them.</p>";
      var grid = el("div", "st-mod-grid big");
      M.items.forEach(function (it, k) {
        var A = M.ans[k], b = button("st-mod-q" + (A.a != null && A.a !== "" ? " ans" : "") + (A.flag ? " flag" : ""), String(k + 1));
        b.addEventListener("click", function () { show(k); });
        grid.appendChild(b);
      });
      box.appendChild(grid);
      var sub = button("st-btn primary", "<span>" + (full && state.mi === 0 ? "Submit and start Module 2" : "Submit module") + "</span>" + icon(I.arrow));
      sub.addEventListener("click", submit);
      box.appendChild(el("div", "st-acts")).appendChild(sub);
      state.els.stage.appendChild(box);
      state.inReview = true;
      state.els.mapB.querySelector("b").textContent = "—";
      state.els.nextB.textContent = "Next";
      state.els.nextB.disabled = true;
      state.els.backB.disabled = false;
      toTop();
    }
    function submit() {
      if (state.submitted) return;
      state.submitted = true;
      saveCurrent();
      clearInterval(state.tick);
      var M = state.M;
      M.time = (Date.now() - state.t0) / 1000;
      M.res = M.items.map(function (it, k) {
        var A = M.ans[k], ok = A.a == null || A.a === "" ? false : it.type === "mc" ? A.a === it.answer : sprRight(it, A.a);
        var firstOk = A.first == null ? false : it.type === "mc" ? A.first === it.answer : sprRight(it, A.first);
        var c = it.type === "mc" && A.a != null ? it.choices[A.a] : null;
        var r = record({ k: it.skill, s: it.seed, d: it.diff, f: it.form, ok: ok, c: null, t: A.t, ch: A.ch, tr: ok ? null : c ? c.tr : null, eg: ok ? null : c ? c.err : null, m: "module", target: 95, p: A.a });
        return { it: it, ok: ok, t: A.t, blank: A.a == null || A.a === "", flag: A.flag, flip: firstOk && !ok, fixed: !firstOk && ok && A.first != null, entry: r.entry };
      });
      state.submitted = false;
      if (full && state.mi === 0) {
        var right = M.res.filter(function (r) { return r.ok; }).length;
        mods.push({ n: 2, plan: modulePlan(seed + "m2", right / M.items.length >= 0.6 ? "hard" : "easy"), level: right / M.items.length >= 0.6 ? "harder" : "easier" });
        between(right, M.items.length);
      } else results();
    }
    function between(right, n) {
      page.innerHTML = "";
      var c = el("article", "st-card st-mod-intro" + (reduced() ? "" : " in"));
      c.innerHTML = '<div class="st-mod-ic">' + icon(I.pause) + "</div><h2>Module 1 is in.</h2><p class='st-lede'>Take a breath. Module 2 is the " + mods[1].level +
        " one — on the real test, that's how the score is spread. 22 more questions, 35 more minutes.</p>";
      var go = button("st-btn primary lg", "<span>Start Module 2</span>" + icon(I.arrow));
      go.addEventListener("click", function () { start(1); });
      c.appendChild(go);
      page.appendChild(c);
      focusSoon(go);
      void right; void n;
    }
    function results() {
      TOOLS.close();
      page.innerHTML = "";
      var top = el("header", "st-ptop");
      var back = button("st-back", icon(I.back) + "<span>SAT Math</span>");
      back.addEventListener("click", function () { ctx.go.hub(); });
      top.appendChild(back);
      top.appendChild(el("div", "st-ptitle", "Module results"));
      page.appendChild(top);
      var all = [];
      mods.forEach(function (M) { if (M.res) M.res.forEach(function (r, k) { all.push(Object.assign({ mod: M.n, q: k + 1 }, r)); }); });
      var right = all.filter(function (r) { return r.ok; }).length, est = estimate();
      var head = el("section", "st-card st-mres-h" + (reduced() ? "" : " in"));
      head.innerHTML = '<div class="st-mres-big"><span class="st-eyebrow">Right</span><b><span class="st-cu">0</span><i>/' + all.length + "</i></b></div>" +
        (est ? '<div class="st-mres-big"><span class="st-eyebrow">Your estimate now</span><b class="st-cu2">' + est.score + "</b><span class='st-mres-range'>likely " + est.lo + "–" + est.hi + "</span></div>" : "") +
        '<div class="st-mres-big"><span class="st-eyebrow">Time used</span><b>' + mmss(mods.reduce(function (a, M) { return a + (M.time || 0); }, 0)) + "</b><span class='st-mres-range'>of " + (full ? "70:00" : "35:00") + "</span></div>";
      page.appendChild(head);
      countUp(head.querySelector(".st-cu"), 0, right, 900);
      page.appendChild(paceReport(all));
      var list = el("section", "st-card st-mres-list");
      list.innerHTML = "<h3>Question by question</h3>";
      var tbl = el("div", "st-mres-rows");
      all.forEach(function (r) {
        var row = el("div", "st-mres-r " + (r.ok ? "ok" : "no"));
        row.innerHTML = '<span class="st-mres-q">' + (full ? "M" + r.mod + " · " : "") + "Q" + r.q + '</span><span class="st-mres-s">' + esc(SK[r.it.skill].t) + "</span>" +
          '<span class="st-mres-d d' + r.it.diff + '">' + ["", "Easy", "Medium", "Hard"][r.it.diff] + "</span>" +
          '<span class="st-mres-t">' + mmss(r.t) + "</span>" + '<span class="st-mres-k">' + (r.ok ? icon(I.check) + "Right" : r.blank ? "Blank" : icon(I.x) + "Missed") + "</span>";
        tbl.appendChild(row);
      });
      list.appendChild(tbl);
      page.appendChild(list);
      var miss = all.filter(function (r) { return !r.ok; }).length;
      var acts = el("div", "st-acts");
      if (miss) {
        var lab = button("st-btn primary", icon(I.lab) + "<span>Take apart your " + plural(miss, "miss", "misses") + " in the Error Lab</span>");
        lab.addEventListener("click", function () { ctx.go.page("Errors"); });
        acts.appendChild(lab);
      }
      var home = button("st-btn", "<span>Back to your SAT plan</span>");
      home.addEventListener("click", function () { ctx.go.hub(); });
      acts.appendChild(home);
      page.appendChild(acts);
      toTop();
    }
    function toast(t) {
      var n = el("div", "st-toast", esc(t));
      document.body.appendChild(n);
      setTimeout(function () { n.classList.add("go"); }, 3200);
      setTimeout(function () { n.remove(); }, 3800);
    }
  }
  SAT.runModule = runModule;

  /* The Pacing Coach: every question as a bar of the time it took, against
     the ~1:35 a question gets on test day; the long misses beside the quick
     wins; answers changed from right to wrong; and a decision threshold. */
  function paceReport(all) {
    var box = el("section", "st-card st-pace");
    var avg = all.reduce(function (a, r) { return a + r.t; }, 0) / Math.max(1, all.length);
    box.innerHTML = '<header class="st-card-h">' + icon(I.timer) + "<div><h3>Pacing Coach</h3><p>You averaged <b>" + mmss(avg) + "</b> a question. Test day gives about <b>1:35</b>.</p></div></header>";
    var W = 640, H = 150, L = 30, pad = 6, top = Math.max(200, Math.max.apply(null, all.map(function (r) { return r.t; })) * 1.08);
    var P = Pic(W, H), bw = (W - L - pad) / all.length;
    function Y(v) { return H - 18 - v / top * (H - 30); }
    [60, 120, 180, 240, 300].forEach(function (s) { if (s < top) { P.line(L, Y(s), W - pad, Y(s), "st-f-grid"); P.text(L - 5, Y(s) + 4, mmss(s), { cls: "st-f-n xs", a: "end", raw: true }); } });
    all.forEach(function (r, k) {
      var x = L + k * bw + 1.5;
      P.add('<rect x="' + x.toFixed(1) + '" y="' + Y(r.t).toFixed(1) + '" width="' + Math.max(2, bw - 3).toFixed(1) + '" height="' + (Y(0) - Y(r.t)).toFixed(1) + '" rx="2" class="st-pace-b ' + (r.ok ? "ok" : "no") + '"><title>Q' + r.q + ": " + mmss(r.t) + (r.ok ? ", right" : ", missed") + "</title></rect>");
    });
    P.line(L, Y(95), W - pad, Y(95), "st-pace-aim");
    P.text(W - pad, Y(95) - 5, "aim 1:35", { cls: "st-f-n xs c-o", a: "end", raw: true });
    P.line(L, Y(0), W - pad, Y(0), "st-f-axis");
    box.insertAdjacentHTML("beforeend", '<div class="st-pace-chart">' + P.svg("Seconds spent on each question") + '<p class="st-pace-key"><i class="ok"></i>Right <i class="no"></i>Missed <i class="aim"></i>Test-day pace</p></div>');
    var slowMiss = all.filter(function (r) { return !r.ok && r.t > 150; }).sort(function (a, b) { return b.t - a.t; });
    var quickWin = all.filter(function (r) { return r.ok && r.t < 80; }).sort(function (a, b) { return a.t - b.t; });
    var flips = all.filter(function (r) { return r.flip; }).length, fixes = all.filter(function (r) { return r.fixed; }).length;
    var tips = el("div", "st-pace-tips");
    if (slowMiss.length) {
      var s = slowMiss[0], q = quickWin[0];
      tips.appendChild(el("div", "st-pace-tip warn", icon(I.flag) + "<div><b>Skip intelligence.</b><p>You spent <b>" + mmss(s.t) + "</b> on Q" + s.q + " and missed it" +
        (q ? "; you spent <b>" + mmss(q.t) + "</b> on Q" + q.q + " and got it right" : "") + ". Every question is worth the same point.</p><p class='st-pace-rule'>Your decision threshold: <b>2:00</b>. When a question passes it, make your best guess, flag it, and move on — come back if there's time.</p></div>"));
    } else {
      tips.appendChild(el("div", "st-pace-tip good", icon(I.check) + "<div><b>No time sinks.</b><p>No question took you more than 2:30 and still got away. That's the habit that protects a score.</p></div>"));
    }
    if (flips || fixes) tips.appendChild(el("div", "st-pace-tip", icon(I.loop) + "<div><b>Changing answers.</b><p>You changed " + plural(flips + fixes, "answer") + ": " +
      plural(fixes, "wrong answer") + " to right, " + plural(flips, "right answer") + " to wrong. " + (flips > fixes ? "Your first instinct was better — change an answer only when you've found a reason, not a feeling." : "Your second looks were worth it.") + "</p></div>"));
    var blanks = all.filter(function (r) { return r.blank; }).length;
    if (blanks) tips.appendChild(el("div", "st-pace-tip warn", icon(I.x) + "<div><b>" + plural(blanks, "blank") + ".</b><p>There's no penalty for guessing on the SAT. Never leave one empty — pick your best remaining choice in the last minute.</p></div>"));
    box.appendChild(tips);
    return box;
  }
  SAT.paceReport = paceReport;

  /* ================================================================= Hub
     The course page. It leads with one thing — what to do next — and keeps
     everything else a calm scroll below: the score the practice points to,
     today's mission, the biggest opportunity, the SAT Map, and how points
     are being lost. Never "you are bad at math": a map, and a next step. */
  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }
  function statusDot(id) {
    var s = status(id);
    return '<i class="st-dot ' + s + '" title="' + (s === "good" ? "Strong" : s === "mid" ? "Getting there" : s === "low" ? "Needs work" : "Not tested yet") + '"></i>';
  }
  function bar(p, cls) { return '<span class="st-bar ' + (cls || "") + '"><i style="width:' + clamp(p, 0, 100) + '%"></i></span>'; }

  function scoreCard(o) {
    o = o || {};
    var est = estimate(), card = el("section", "st-card st-score" + (o.big ? " big" : ""));
    if (!est) {
      card.innerHTML = '<span class="st-eyebrow">Estimated Math score</span><b class="st-score-n dim">—</b><p class="st-muted">A score appears once you have answered a few questions. The Brain Scan is the fastest way.</p>';
      return card;
    }
    var span = 600, L = (est.lo - 200) / span * 100, Rr = (est.hi - 200) / span * 100, Pp = (est.score - 200) / span * 100;
    card.innerHTML = '<span class="st-eyebrow">Estimated Math score</span>' +
      '<div class="st-score-row"><b class="st-score-n">' + (o.animate ? 200 : est.score) + '</b><span class="st-score-of">/ 800</span></div>' +
      '<div class="st-range" aria-label="Likely between ' + est.lo + " and " + est.hi + '"><span class="st-range-band" style="left:' + L + "%;width:" + (Rr - L) + '%"></span><span class="st-range-dot" style="left:' + Pp + '%"></span>' +
      (REC.target && REC.target.goal ? '<span class="st-range-goal" style="left:' + ((REC.target.goal - 200) / span * 100) + '%" title="Your goal: ' + REC.target.goal + '"></span>' : "") +
      '<span class="st-range-t" style="left:0">200</span><span class="st-range-t" style="left:100%">800</span></div>' +
      '<p class="st-muted">Likely between <b>' + est.lo + "</b> and <b>" + est.hi + "</b>, from " + plural(est.n, "answer") + ". An estimate from practice, not an official score." +
      (REC.target && REC.target.goal ? " Goal: <b>" + REC.target.goal + "</b>." : "") + "</p>";
    var doms = el("div", "st-doms");
    [1, 2, 3, 4].forEach(function (n) {
      var D = DOMAINS[n], p2 = pct(domainShare(n));
      doms.appendChild(el("div", "st-dom " + D.cls, '<span class="st-dom-n">' + icon(D.glyph) + esc(D.short || D.t) + '</span><span class="st-dom-w">' + Math.round(D.w * 100) + "% of the test</span>" + bar(p2, D.cls) + "<b>" + p2 + "%</b>"));
    });
    card.appendChild(doms);
    if (o.animate) countUp(card.querySelector(".st-score-n"), 200, est.score, 1500);
    return card;
  }

  function missionCard(ctx) {
    var card = el("section", "st-card st-mission");
    var plan = buildPlan(20, { kind: "mission" }), doneToday = REC.days[dayKey()] && REC.days[dayKey()].m;
    card.innerHTML = '<header class="st-card-h">' + icon(I.flame) + "<div><h3>Today's " + plan.mins + "-minute mission</h3><p>" +
      (doneToday ? "Done for today — the streak is safe. More is always welcome." : "One skill, done properly. The plan is made from your map.") + "</p></div></header>";
    var ol = el("ol", "st-mlist");
    plan.groups.forEach(function (g) { ol.appendChild(el("li", null, '<span class="st-mmin">' + g.mins + " min</span><span>" + esc(g.t) + "</span>")); });
    card.appendChild(ol);
    if (plan.goal) card.appendChild(el("p", "st-mgoal", icon(I.target) + "<span><b>Goal:</b> " + esc(plan.goal) + "</span>"));
    var go = button("st-btn primary", "<span>" + (doneToday ? "Do another mission" : "Start today's mission") + "</span>" + icon(I.arrow));
    go.addEventListener("click", function () { ctx.go.page("Mission"); });
    card.appendChild(go);
    var t = el("div", "st-time");
    t.appendChild(el("span", "st-time-l", "Or: I have"));
    [5, 10, 20, 45, 90].forEach(function (mn) {
      var b = button("st-time-b", "<b>" + mn + "</b><span>min</span>");
      b.title = mn === 90 ? "A full timed Math section, then the Error Lab" : mn === 45 ? "Two skills and a timed mixed set" : "A session made for " + mn + " minutes";
      b.addEventListener("click", function () { ctx.go.page(mn === 90 ? "Module/Full" : "Time/" + mn); });
      t.appendChild(b);
    });
    card.appendChild(t);
    return card;
  }

  function oppCard(ctx) {
    var id = opportunity(), sk = SK[id], card = el("section", "st-card st-opp " + DOMAINS[sk.domain].cls);
    var u = pct(understanding(id)), g = Math.max(10, Math.round(gain(id) / 10) * 10);
    card.innerHTML = '<div class="st-opp-l"><span class="st-eyebrow">' + icon(I.bolt) + "Your biggest opportunity</span>" +
      "<h2>" + esc(sk.t) + "</h2><p class=\"st-opp-why\">" + esc(whyOpportunity(id)) + "</p>" +
      '<p class="st-opp-meta"><span>' + esc(DOMAINS[sk.domain].t) + "</span><span>" + (tested(id) ? "Understanding <b>" + u + "%</b>" : "Not tested yet") + "</span><span>Worth up to <b>+" + g + "</b> points</span>" + loopPips(stage(id)) + "</p></div>";
    var r = el("div", "st-opp-r");
    var fix = button("st-btn primary lg", "<span>Fix this skill — 8 min</span>" + icon(I.arrow));
    fix.addEventListener("click", function () { ctx.go.page("Fix/" + id); });
    var more = button("st-btn ghost", "<span>What's in this skill</span>");
    more.addEventListener("click", function () { ctx.go.page("Skill/" + id); });
    r.appendChild(fix); r.appendChild(more);
    card.appendChild(r);
    return card;
  }

  function mapCard(ctx, o) {
    o = o || {};
    var card = el("section", "st-card st-map");
    card.innerHTML = '<header class="st-card-h">' + icon(I.map) + '<div><h3>Your SAT Map</h3><p>Every skill on the test, how well you understand it, and where it is in the mastery loop.</p></div>' +
      '<div class="st-legend"><span><i class="st-dot good"></i>Strong</span><span><i class="st-dot mid"></i>Getting there</span><span><i class="st-dot low"></i>Needs work</span><span><i class="st-dot none"></i>Not tested</span></div></header>';
    var k = 0;
    [1, 2, 3, 4].forEach(function (n) {
      var D = DOMAINS[n], sec = el("div", "st-map-d " + D.cls);
      sec.innerHTML = '<div class="st-map-dh"><span class="st-map-dn">' + icon(D.glyph) + "<b>" + esc(D.t) + '</b></span><span class="st-map-dw">' + Math.round(D.w * 100) + "% of the test · " + D.q + '</span><span class="st-map-dp">' + pct(domainShare(n)) + "%</span></div>";
      skillsIn(n).forEach(function (id) {
        var sk = SK[id], u = pct(understanding(id)), t = tested(id);
        var row = button("st-map-r" + (t ? "" : " untested") + (o.animate && !reduced() ? " grow" : ""),
          '<span class="st-map-s"><b>' + esc(sk.t) + "</b></span>" +
          '<span class="st-map-u">' + bar(t ? u : 0, status(id)) + "<em>" + (t ? u + "%" : "—") + "</em></span>" + statusDot(id) + loopPips(stage(id)) +
          '<span class="st-map-go">' + (due(id) ? '<span class="st-due">Review due</span>' : "") + icon(I.arrow) + "</span>");
        row.style.setProperty("--d", (k++ * 55) + "ms");
        row.addEventListener("click", function () { ctx.go.page("Skill/" + id); });
        sec.appendChild(row);
      });
      card.appendChild(sec);
    });
    return card;
  }

  function errorsCard(ctx) {
    var ep = errorProfile(), tr = traps(), open = misses(true).length;
    var card = el("section", "st-card st-ins st-errcard");
    card.innerHTML = '<header class="st-card-h">' + icon(I.lab) + "<div><h3>How you lose points</h3><p>" + (!ep.total ? "Miss a question and this starts to fill in." :
      ep.told === ep.total ? "From " + plural(ep.total, "miss", "misses") + ", in your own words." :
      "From the " + plural(ep.total, "wrong answer") + " you chose" + (ep.told ? " (" + ep.told + " in your own words)" : "") + ". Classify them in the Error Lab to sharpen it.") + "</p></div></header>";
    var list = el("div", "st-bars");
    BUCKET_ORDER.forEach(function (b) {
      var n = ep.b[b], p2 = ep.total ? Math.round(n / ep.total * 100) : 0;
      list.appendChild(el("div", "st-brow b-" + b, "<span>" + esc(BUCKETS[b].t) + "</span>" + bar(p2, "b-" + b) + "<b>" + (ep.total ? p2 + "%" : "—") + "</b>"));
    });
    card.appendChild(list);
    if (tr.length) card.appendChild(el("p", "st-ins-say", icon(I.scope) + "<span>Your most common trap: <b>" + esc(tr[0].tr) + "</b>" + (tr[0].n > 1 ? " (" + tr[0].n + " times)" : "") + ".</span>"));
    else if (ep.total) {
      var top = BUCKET_ORDER.slice().sort(function (a, b) { return ep.b[b] - ep.b[a]; })[0];
      card.appendChild(el("p", "st-ins-say", icon(I.bulb) + "<span><b>" + esc(BUCKETS[top].t) + ":</b> " + esc(BUCKETS[top].fix) + "</span>"));
    }
    var go = button("st-btn sm", icon(I.lab) + "<span>" + (open ? "Error Lab · " + open + " to take apart" : "Open the Error Lab") + "</span>");
    go.addEventListener("click", function () { ctx.go.page("Errors"); });
    card.appendChild(go);
    return card;
  }
  function calibrationSay(rows) {
    var c = rows[3], g = rows[0], u = rows[1];
    if (c.n >= 4 && c.ok / c.n < 0.8) return "When you're <b>certain</b>, you're wrong " + Math.round((1 - c.ok / c.n) * 100) + "% of the time. The questions that feel easy deserve one more look at what's being asked.";
    if ((g.n + u.n) >= 4 && (g.ok + u.ok) / (g.n + u.n) >= 0.55) return "You know more than you think: when unsure or guessing, you're right " + Math.round((g.ok + u.ok) / (g.n + u.n) * 100) + "% of the time. Trust your work a little more.";
    if (c.n >= 4) return "Well calibrated: when you're certain, you're right " + Math.round(c.ok / c.n * 100) + "% of the time.";
    return "Tap how sure you are after each answer, and this shows whether your confidence can be trusted.";
  }
  function confCard() {
    var rows = calibration(), card = el("section", "st-card st-ins");
    card.innerHTML = '<header class="st-card-h">' + icon(I.target) + "<div><h3>Your confidence</h3><p>How often you're right at each level of sure.</p></div></header>";
    var t = el("div", "st-bars");
    rows.slice().reverse().forEach(function (r) {
      var p2 = r.n ? Math.round(r.ok / r.n * 100) : 0;
      t.appendChild(el("div", "st-brow c" + r.k, '<span class="st-cconf">' + confBars(r.k) + esc(r.t) + "</span>" + bar(p2, "conf") + "<b>" + (r.n ? p2 + "%" : "—") + '</b><i class="st-n">' + (r.n ? r.n : "") + "</i>"));
    });
    card.appendChild(t);
    card.appendChild(el("p", "st-ins-say", icon(I.bulb) + "<span>" + calibrationSay(rows) + "</span>"));
    return card;
  }
  function paceCard() {
    var pc = pacing(), card = el("section", "st-card st-ins");
    card.innerHTML = '<header class="st-card-h">' + icon(I.timer) + "<div><h3>Pacing</h3><p>Average time per question, by domain.</p></div></header>";
    var t = el("div", "st-bars"), worst = null;
    [1, 2, 3, 4].forEach(function (n) {
      var d = pc[n], avg = d.n ? d.t / d.n : 0, aim = d.n ? d.tg / d.n : 95, over = avg > aim;
      if (d.n && (!worst || avg / aim > worst.r)) worst = { n: n, r: avg / aim, avg: avg, aim: aim };
      t.appendChild(el("div", "st-brow " + DOMAINS[n].cls, "<span>" + esc(DOMAINS[n].short || DOMAINS[n].t) + "</span>" + bar(d.n ? Math.min(100, avg / 180 * 100) : 0, over ? "slow" : "fast") + "<b>" + (d.n ? mmss(avg) : "—") + "</b>"));
    });
    card.appendChild(t);
    card.appendChild(el("p", "st-ins-say", icon(I.bulb) + "<span>" + (worst && worst.r > 1.15 ? "<b>" + esc(DOMAINS[worst.n].t) + "</b> takes you " + mmss(worst.avg) + " a question against an aim of about " + mmss(worst.aim) +
      ". The strategy layers show the faster routes." : worst ? "Your pace is on target. Test day gives about 1:35 a question." : "Answer a few questions and your pace shows here.") + "</span>"));
    return card;
  }
  function toolsRow(ctx) {
    var open = misses(true).length;
    var tiles = [
      { k: "Module", t: "Practice module", s: "22 questions · 35 min, timed like test day", i: I.timer },
      { k: "Errors", t: "Error Lab", s: open ? open + " miss" + (open === 1 ? "" : "es") + " to take apart" : "Every miss, classified and taken apart", i: I.lab, badge: open },
      { k: "Library", t: "Strategy Library", s: STRATS.length + " strategies, each with a worked example", i: I.book },
      { k: "Spot", t: "Pattern Spotter", s: "A quick game: what kind of question is this?", i: I.eye },
      { k: "Target", t: "Target score", s: REC.target && REC.target.goal ? "Goal " + REC.target.goal + " — where the points are" : "Set a goal and see where the points are", i: I.target },
      { k: "Scan", t: "Brain Scan", s: REC.scan ? "Last taken " + ago(REC.scan.at) + " — take it again" : "25 minutes to map every skill", i: I.brain }
    ];
    var wrap = el("section", "st-tools");
    tiles.forEach(function (t) {
      var b = button("st-tile", '<span class="st-tile-i">' + icon(t.i) + "</span><b>" + esc(t.t) + "</b><span>" + esc(t.s) + "</span>" + (t.badge ? '<em class="st-badge">' + t.badge + "</em>" : ""));
      b.addEventListener("click", function () { ctx.go.page(t.k); });
      wrap.appendChild(b);
    });
    return wrap;
  }
  function ago(t) {
    var d = Math.floor((Date.now() - t) / DAY);
    return d <= 0 ? "today" : d === 1 ? "yesterday" : d < 14 ? d + " days ago" : Math.round(d / 7) + " weeks ago";
  }
  function domainsRow(ctx) {
    var wrap = el("section", "st-domsec");
    wrap.innerHTML = '<h2 class="st-h2">Learn by domain</h2><p class="st-sub">Every skill’s lesson and practice, domain by domain — for when you want to go through it in order.</p>';
    var g = el("div", "st-domgrid");
    [1, 2, 3, 4].forEach(function (n) {
      var D = DOMAINS[n], ids = skillsIn(n), st = ids.filter(function (id) { return stage(id) >= 5; }).length;
      var b = button("st-domcard " + D.cls, '<span class="st-domcard-i">' + icon(D.glyph) + "</span><b>" + esc(D.t) + "</b><span>" + esc(D.d) + "</span><em>" + plural(ids.length, "skill") + " · " + st + " at Timed or beyond</em>");
      b.addEventListener("click", function () { ctx.go.unit(n); });
      g.appendChild(b);
    });
    wrap.appendChild(g);
    return wrap;
  }
  function heroBar(ctx, host) {
    var hero = el("header", "st-hero");
    var first = ctx.me && (ctx.me.firstName || String(ctx.me.name || "").split(" ")[0]);
    var sk = streak(), today = REC.days[dayKey()] || { q: 0, s: 0 };
    hero.innerHTML = '<div class="st-hero-l"><p class="st-eyebrow">Test Prep</p><h1>SAT Math</h1><p class="st-hero-sub">' +
      (REC.scan ? esc(greeting() + (first ? ", " + first : "") + ".") + " Your plan is ready." : "Diagnose → understand → practise → explain → transfer → re-test → master.") + "</p></div>";
    var r = el("div", "st-hero-r");
    r.appendChild(el("div", "st-pill" + (sk ? " hot" : ""), icon(I.flame) + "<b>" + sk + "</b><span>day" + (sk === 1 ? "" : "s") + "</span>"));
    r.appendChild(el("div", "st-pill", icon(I.clock) + "<b>" + Math.round(today.s / 60) + "</b><span>min today</span>"));
    var soc = button("st-soc" + (prefs().socratic ? " on" : ""), '<span class="st-sw"><i></i></span><span><b>Socratic mode</b><em>Don\'t give me the answer</em></span>');
    soc.setAttribute("role", "switch");
    soc.setAttribute("aria-checked", String(!!prefs().socratic));
    soc.title = "When on, a miss is never followed by the answer: the coach asks questions until you solve it, then asks you to explain it.";
    soc.addEventListener("click", function () {
      var on = !prefs().socratic;
      setPref("socratic", on);
      soc.classList.toggle("on", on);
      soc.setAttribute("aria-checked", String(on));
    });
    r.appendChild(soc);
    hero.appendChild(r);
    void host;
    return hero;
  }
  function scanInvite(ctx) {
    var card = el("section", "st-card st-invite");
    card.innerHTML = '<div class="st-inv-l"><span class="st-eyebrow">' + icon(I.brain) + 'Start here</span><h2>Take the SAT Brain Scan</h2>' +
      '<p class="st-lede">Not a test you pass or fail — a map. Every skill on the SAT, once, getting harder or easier as you go. Tap how sure you are after each answer. At the end you get:</p>' +
      '<ul class="st-inv-list"><li>' + icon(I.map) + "<span><b>Your SAT Map</b> — every skill, how well you understand it</span></li><li>" + icon(I.bolt) +
      "<span><b>Your biggest opportunity</b> — where the points are, and an 8-minute fix</span></li><li>" + icon(I.target) +
      "<span><b>An estimated score</b> — with its honest range</span></li><li>" + icon(I.lab) + "<span><b>How you lose points</b> — concepts, misreading, slips, time</span></li></ul></div>";
    var r = el("div", "st-inv-r");
    var full = button("st-btn primary lg", "<span>Full scan · about 25 min</span>" + icon(I.arrow));
    full.addEventListener("click", function () { ctx.go.page("Scan"); });
    var quick = button("st-btn", "<span>Quick scan · about 12 min</span>");
    quick.addEventListener("click", function () { ctx.go.page("Scan/Quick"); });
    var skip = button("st-link", "Skip it — start with today's mission");
    skip.addEventListener("click", function () { ctx.go.page("Mission"); });
    r.appendChild(full); r.appendChild(quick); r.appendChild(skip);
    if (REC.scanRun) r.insertBefore(el("p", "st-resume", icon(I.play) + "<span>You have a scan in progress — question " + (REC.scanRun.i + 1) + ". It picks up where you left off.</span>"), full);
    card.appendChild(r);
    return card;
  }
  function renderHub(host, ctx) {
    host.innerHTML = "";
    var root = el("div", "st-root st-hub");
    host.appendChild(root);
    root.appendChild(heroBar(ctx, host));
    var hasData = ORDER.some(tested);
    if (!REC.scan) root.appendChild(scanInvite(ctx));
    if (hasData) {
      var row = el("div", "st-row2");
      row.appendChild(scoreCard());
      row.appendChild(missionCard(ctx));
      root.appendChild(row);
      root.appendChild(oppCard(ctx));
    } else {
      var row2 = el("div", "st-row2");
      row2.appendChild(missionCard(ctx));
      row2.appendChild(oppCard(ctx));
      root.appendChild(row2);
    }
    root.appendChild(mapCard(ctx));
    if (hasData) {
      var ins = el("div", "st-row3");
      ins.appendChild(errorsCard(ctx));
      ins.appendChild(confCard());
      ins.appendChild(paceCard());
      root.appendChild(ins);
    }
    root.appendChild(toolsRow(ctx));
    root.appendChild(domainsRow(ctx));
    root.appendChild(el("p", "st-foot", "Built on the structure of the digital SAT's Math section: four domains, 44 questions in two 35-minute modules, a calculator and reference sheet throughout. " +
      "Every question here is OEdu's own. Scores are estimates from your practice — never a promise."));
  }
  SAT.renderHub = renderHub;

  /* ======================================================= The scan reveal
     The map, built skill by skill; the score, counting up; the biggest
     opportunity; and how the points were lost. */
  function reveal(host, ctx, fresh) {
    var page = pageTop(host, ctx, "Brain Scan · Results", { cls: "st-reveal" });
    var s = REC.scan || {};
    var head = el("section", "st-rv-h" + (reduced() ? "" : " in"));
    head.innerHTML = '<span class="st-eyebrow">' + icon(I.brain) + "SAT Brain Scan</span><h1>Here's your SAT Map.</h1>" +
      '<p class="st-lede">' + plural(s.n || 0, "question") + " in " + mmss(s.t || 0) + ". This is where you are right now — not who you are. Everything below can move, and the plan is built to move it.</p>";
    page.appendChild(head);
    var row = el("div", "st-row2");
    row.appendChild(scoreCard({ animate: fresh, big: true }));
    var right = el("section", "st-card st-rv-stats");
    right.innerHTML = '<div class="st-rv-stat"><b>' + (s.right || 0) + "<i>/" + (s.n || 0) + "</i></b><span>right</span></div>" +
      '<div class="st-rv-stat"><b>' + ORDER.filter(function (id) { return status(id) === "good"; }).length + "</b><span>skills already strong</span></div>" +
      '<div class="st-rv-stat"><b>' + ORDER.filter(function (id) { return status(id) === "low"; }).length + "</b><span>skills with the most room</span></div>" +
      (s.rn ? '<div class="st-rv-stat"><b>' + s.rg + "<i>/" + s.rn + "</i></b><span>question types recognised</span></div>" : "");
    row.appendChild(right);
    page.appendChild(row);
    page.appendChild(oppCard(ctx));
    page.appendChild(mapCard(ctx, { animate: fresh }));
    var ins = el("div", "st-row3");
    ins.appendChild(errorsCard(ctx));
    ins.appendChild(confCard());
    ins.appendChild(paceCard());
    page.appendChild(ins);
    var acts = el("div", "st-acts center");
    var open = misses(true).length;
    if (open) {
      var lab = button("st-btn", icon(I.lab) + "<span>Take apart your " + plural(open, "miss", "misses") + "</span>");
      lab.addEventListener("click", function () { ctx.go.page("Errors"); });
      acts.appendChild(lab);
    }
    var home = button("st-btn primary lg", "<span>Go to your SAT plan</span>" + icon(I.arrow));
    home.addEventListener("click", function () { ctx.go.hub(); });
    acts.appendChild(home);
    page.appendChild(acts);
    toTop();
  }
  SAT.reveal = reveal;

  /* ========================================================== Scan intro */
  function scanIntro(host, ctx, kind) {
    if (REC.scanRun && REC.scanRun.kind === kind) { runScan(host, ctx, kind); return; }
    var page = pageTop(host, ctx, "SAT Brain Scan");
    var card = el("article", "st-card st-scan-intro" + (reduced() ? "" : " in"));
    var n = kind === "quick" ? 12 : ORDER.length + 3;
    card.innerHTML = '<div class="st-scan-art">' + icon(I.brain) + "</div>" +
      "<h1>" + (kind === "quick" ? "Quick scan" : "Full Brain Scan") + "</h1>" +
      '<p class="st-lede">' + n + " questions, about " + (kind === "quick" ? 12 : 25) + " minutes. " +
      (kind === "quick" ? "Two or more from every domain — the rest of the map is estimated until you practise it." : "Every skill on the SAT, once, then three more where your answers left the most doubt.") + "</p>" +
      '<div class="st-scan-how">' +
      '<div><span class="st-hn">1</span><b>Answer</b><p>Choose, or type your own. Cross out choices you rule out. Calculator and reference are there, like test day.</p></div>' +
      '<div><span class="st-hn">2</span><b>Say how sure you are</b><p>' + CONF.map(function (c) { return confBars(c.k) + esc(c.t); }).join(" ") + "<br>One tap locks the answer in. It tells the scan what you know, not just what you picked.</p></div>" +
      '<div><span class="st-hn">3</span><b>No marks until the end</b><p>It gets harder when you’re right and easier when you’re not. Then: your SAT Map.</p></div></div>';
    var acts = el("div", "st-acts center");
    var go = button("st-btn primary lg", "<span>Begin the scan</span>" + icon(I.arrow));
    go.addEventListener("click", function () { runScan(host, ctx, kind); });
    var alt = button("st-btn", kind === "quick" ? "Full scan instead" : "Quick scan instead");
    alt.addEventListener("click", function () { ctx.go.page(kind === "quick" ? "Scan" : "Scan/Quick"); });
    acts.appendChild(alt); acts.appendChild(go);
    card.appendChild(acts);
    page.appendChild(card);
    focusSoon(go);
  }

  /* ============================================================ Error Lab
     Every missed question gets classified — not just "incorrect" but what
     happened — and taken apart: the coach's reply to that, the idea rebuilt,
     the explanation in layers, and the same idea in a different disguise. */
  function errorLab(host, ctx) {
    var page = pageTop(host, ctx, "Error Lab");
    var head = el("section", "st-rv-h");
    head.innerHTML = '<span class="st-eyebrow">' + icon(I.lab) + "Error Lab</span><h1>Every miss, taken apart.</h1>" +
      '<p class="st-lede">A miss is the most useful thing that happens in practice. Here each one gets classified — what you were thinking — and rebuilt, so the same trap doesn\'t get you twice.</p>';
    page.appendChild(head);
    var row = el("div", "st-row2");
    var prof = errorsCard(ctx);
    prof.querySelector(".st-btn") && prof.querySelector(".st-btn").remove();
    row.appendChild(prof);
    var tr = traps(), tc = el("section", "st-card st-ins");
    tc.innerHTML = '<header class="st-card-h">' + icon(I.scope) + "<div><h3>Your recurring traps</h3><p>The wrong turns your wrong answers took.</p></div></header>" +
      (tr.length ? '<ol class="st-traps">' + tr.slice(0, 6).map(function (t) { return "<li><span>" + esc(t.tr.charAt(0).toUpperCase() + t.tr.slice(1)) + "</span><b>" + t.n + "×</b></li>"; }).join("") + "</ol>"
        : '<p class="st-muted">None yet. Traps show up here as soon as a wrong choice falls into one.</p>');
    row.appendChild(tc);
    page.appendChild(row);
    var open = misses(true).slice().reverse(), done = misses(false).filter(function (x) { return x.rv; }).slice().reverse();
    var sec = el("section", "st-card st-lablist");
    sec.innerHTML = '<header class="st-card-h">' + icon(I.list) + "<div><h3>To take apart" + (open.length ? " · " + open.length : "") + "</h3><p>" +
      (open.length ? "Newest first. Each takes a minute or two." : "Nothing waiting. Every miss so far has been taken apart.") + "</p></div></header>";
    open.slice(0, 40).forEach(function (x) { sec.appendChild(missRow(x, ctx, false)); });
    page.appendChild(sec);
    if (done.length) {
      var sec2 = el("details", "st-card st-lablist done");
      sec2.innerHTML = "<summary><b>Taken apart · " + done.length + "</b><span>Open any to see it again</span></summary>";
      done.slice(0, 30).forEach(function (x) { sec2.appendChild(missRow(x, ctx, true)); });
      page.appendChild(sec2);
    }
  }
  function missRow(x, ctx, doneRow) {
    var sk = SK[x.k], ix = REC.log.indexOf(x);
    var b = button("st-miss" + (doneRow ? " done" : ""),
      '<span class="st-miss-d ' + DOMAINS[sk.domain].cls + '">' + icon(DOMAINS[sk.domain].glyph) + "</span>" +
      '<span class="st-miss-t"><b>' + esc(sk.t) + "</b><span>" + esc(FORMS[x.f] ? FORMS[x.f].t : "") + " · " + ["", "easy", "medium", "hard"][x.d] + " · " + esc({ scan: "Brain Scan", module: "Module", coach: "Practice" }[x.m] || "Practice") + " · " + ago(x.at) +
      (x.e ? " · <em>" + esc(ERR[x.e].t) + "</em>" : "") + "</span></span>" + (x.tr ? '<span class="st-miss-tr">' + esc(x.tr) + "</span>" : "") + icon(I.arrow));
    b.addEventListener("click", function () { ctx.go.page("Errors/" + ix); });
    return b;
  }
  function labReview(host, ctx, ix) {
    var x = REC.log[ix];
    if (!x || !SK[x.k]) { errorLab(host, ctx); return; }
    var page = pageTop(host, ctx, "Error Lab");
    var it = itemOf(x);
    page.appendChild(el("p", "st-blabel", icon(I.lab) + "<span>From " + esc({ scan: "your Brain Scan", module: "a practice module", coach: "practice" }[x.m] || "practice") + ", " + ago(x.at) + " — you took " + mmss(x.t) + (x.c != null ? " and said you were " + CONF[x.c].t.toLowerCase() : "") + ".</span>"));
    var nextOpen = misses(true).filter(function (y) { return y !== x; }).pop();
    var card = qcard(it, {
      mode: "coach", lab: { picked: x.p, entry: x }, socratic: prefs().socratic,
      onTransfer: function () { ctx.go.page("Fix/" + x.k); },
      onNext: function () { markReviewed(x); if (nextOpen) ctx.go.page("Errors/" + REC.log.indexOf(nextOpen)); else ctx.go.page("Errors"); },
      nextLabel: nextOpen ? "Next miss" : "Back to the lab"
    });
    page.appendChild(card.el);
  }

  /* ===================================================== Strategy Library
     A small searchable toolkit rather than a hundred tricks: each strategy
     says when to reach for it, shows it once, and can be tried at once. */
  function library(host, ctx, openId) {
    var page = pageTop(host, ctx, "Strategy Library");
    var head = el("section", "st-rv-h");
    head.innerHTML = '<span class="st-eyebrow">' + icon(I.book) + "Strategy Library</span><h1>A small toolkit.</h1>" +
      '<p class="st-lede">Not a hundred tricks — ' + STRATS.length + " moves that keep working. Each says when to reach for it, shows it once, and lets you try it on three questions.</p>";
    page.appendChild(head);
    var bar = el("div", "st-libbar");
    var sb = el("label", "st-search", icon(I.search));
    var inp = el("input");
    inp.type = "search"; inp.placeholder = "Search: factor, percent, graph it, similar…"; inp.setAttribute("aria-label", "Search strategies");
    sb.appendChild(inp);
    bar.appendChild(sb);
    var chips = el("div", "st-chips"), dom = 0;
    [[0, "All"], [1, "Algebra"], [2, "Advanced Math"], [3, "Data"], [4, "Geometry & Trig"]].forEach(function (c) {
      var b = button("st-chipb" + (c[0] === 0 ? " on" : ""), esc(c[1]));
      b.addEventListener("click", function () { dom = c[0]; [].forEach.call(chips.children, function (x) { x.classList.toggle("on", x === b); }); filter(); });
      chips.appendChild(b);
    });
    bar.appendChild(chips);
    page.appendChild(bar);
    var grid = el("div", "st-libgrid");
    page.appendChild(grid);
    var none = el("p", "st-muted st-libnone", "");
    page.appendChild(none);
    STRATS.forEach(function (s) {
      var c = el("article", "st-strat " + DOMAINS[s.domain].cls);
      c.dataset.text = (s.t + " " + s.rule + " " + (s.when || "") + " " + (s.skills || []).map(function (id) { return SK[id] ? SK[id].t : ""; }).join(" ")).toLowerCase();
      c.dataset.dom = s.domain;
      c.innerHTML = '<span class="st-strat-d">' + icon(DOMAINS[s.domain].glyph) + esc(DOMAINS[s.domain].short || DOMAINS[s.domain].t) + "</span>" +
        "<h3>" + esc(s.t) + '</h3><p class="st-strat-rule">' + fmt(s.rule) + "</p>" + (s.when ? '<p class="st-strat-when"><b>Reach for it when</b> ' + fmt(s.when) + "</p>" : "");
      var more = button("st-link", "See it worked" + icon(I.down));
      var body = el("div", "st-strat-body");
      body.hidden = s.id !== openId;
      if (s.ex) body.innerHTML = '<p class="st-strat-ex">' + fmt(s.ex) + "</p>" + walkHTML(s.walk);
      var tr = button("st-btn sm primary", icon(I.play) + "<span>Try it — 3 questions</span>");
      tr.addEventListener("click", function () { ctx.go.page("Try/" + s.id); });
      body.appendChild(tr);
      more.addEventListener("click", function () { body.hidden = !body.hidden; more.classList.toggle("open", !body.hidden); });
      c.appendChild(more);
      c.appendChild(body);
      grid.appendChild(c);
      if (s.id === openId) setTimeout(function () { c.scrollIntoView({ block: "center" }); }, 50);
    });
    function filter() {
      var q = inp.value.trim().toLowerCase(), shown = 0;
      [].forEach.call(grid.children, function (c) {
        var ok = (!q || c.dataset.text.indexOf(q) > -1) && (!dom || +c.dataset.dom === dom);
        c.hidden = !ok;
        if (ok) shown++;
      });
      none.textContent = shown ? "" : "No strategy matches “" + inp.value.trim() + "”.";
    }
    inp.addEventListener("input", filter);
  }
  function strategyPlan(id) {
    var s = STRATS.filter(function (x) { return x.id === id; })[0];
    if (!s) return null;
    var ids = (s.skills || []).filter(function (k) { return SK[k]; });
    if (!ids.length) return null;
    var blocks = [0, 1, 2].map(function (k) { var sid = ids[k % ids.length]; return { k: "q", id: sid, diff: k === 0 ? 1 : 2, form: SK[sid].forms[k % SK[sid].forms.length], group: 0, label: "Use it: " + s.t }; });
    return { kind: "strategy", mins: 5, eyebrow: "Strategy", title: s.t, groups: [{ t: s.rule.replace(/<[^>]+>/g, "").slice(0, 70), mins: 5 }], blocks: blocks, chip: false };
  }

  /* ======================================================= Pattern Spotter
     Ten questions, none to solve: just name each one. Strong test-takers
     know a question's type in seconds, and the type says which tools to
     reach for. */
  function spotter(host, ctx) {
    var page = pageTop(host, ctx, "Pattern Spotter", { cls: "st-spot-page" });
    var R = LAB.rng(seedNow()), rounds = [], N = 10;
    var pool = R.shuffle(ORDER.slice());
    for (var i = 0; i < N; i++) {
      var id = pool[i % pool.length], it = makeItem(id, "spot:" + R.int(0, 1e9), { diff: 1 + (i % 3) });
      if (it) rounds.push(it);
    }
    var ix = 0, score = 0, streakN = 0, best = 0, times = [], mix = {};
    var hud = el("div", "st-spot-hud");
    page.appendChild(hud);
    var stageS = el("div", "st-sess-stage");
    page.appendChild(stageS);
    function paintHud() {
      hud.innerHTML = '<span><b>' + Math.min(ix + 1, N) + "</b> of " + N + '</span><span class="st-spot-score">' + icon(I.check) + "<b>" + score + "</b></span>" +
        '<span class="st-spot-streak' + (streakN >= 3 ? " hot" : "") + '">' + icon(I.flame) + "<b>" + streakN + "</b> in a row</span>";
    }
    function intro() {
      var c = el("article", "st-card st-scan-intro" + (reduced() ? "" : " in"));
      c.innerHTML = '<div class="st-scan-art">' + icon(I.eye) + "</div><h1>Pattern Spotter</h1><p class=\"st-lede\">Ten questions. <b>Don't solve them</b> — just say what kind of question each one is. " +
        "Strong test-takers recognise the type in seconds; the type tells them which tools to reach for.</p>";
      var go = button("st-btn primary lg", "<span>Play</span>" + icon(I.play));
      go.addEventListener("click", function () { c.remove(); round(); });
      c.appendChild(el("div", "st-acts center")).appendChild(go);
      stageS.appendChild(c);
      focusSoon(go);
    }
    function round() {
      paintHud();
      if (ix >= rounds.length) { end(); return; }
      var it = rounds[ix], t0 = Date.now();
      stageS.innerHTML = "";
      var card = el("article", "st-q st-spot-q" + (reduced() ? "" : " in"));
      card.innerHTML = '<div class="st-qbody">' + stemHTML(it) + "</div>";
      if (it.type === "mc") card.appendChild(el("div", "st-spot-choices", it.choices.map(function (c) { return "<span><b>" + c.L + "</b>" + fmt(c.t) + "</span>"; }).join("")));
      var opts = el("div", "st-recog-opts big");
      recogOptions(it, LAB.rng(it.seed + ":r")).forEach(function (x) {
        var b = button("st-recog-b", esc(x.t));
        b.addEventListener("click", function () {
          var secs2 = (Date.now() - t0) / 1000;
          times.push(secs2);
          [].forEach.call(opts.children, function (c) { c.disabled = true; if (c.textContent === it.ask) c.classList.add("yes"); });
          if (x.ok) { score++; streakN++; best = Math.max(best, streakN); }
          else { b.classList.add("no"); streakN = 0; var key = it.ask + " → " + x.t; mix[key] = (mix[key] || 0) + 1; }
          paintHud();
          var say2 = el("p", "st-recog-say" + (x.ok ? " ok" : ""), (x.ok ? "<b>" + (secs2 < 6 ? "Fast." : "Yes.") + "</b> " : "<b>It's " + esc(it.ask) + ".</b> ") +
            (it.autopsy.clue ? "Clue: " + fmt(it.autopsy.clue) : ""));
          card.appendChild(say2);
          var nx = button("st-btn primary sm", (ix + 1 >= rounds.length ? "See how you did" : "Next") + icon(I.arrow));
          nx.addEventListener("click", function () { ix++; round(); });
          card.appendChild(nx);
          focusSoon(nx);
        });
        opts.appendChild(b);
      });
      card.appendChild(opts);
      stageS.appendChild(card);
      focusSoon(opts.firstChild);
    }
    function end() {
      REC.spot = { best: Math.max((REC.spot || {}).best || 0, score), plays: ((REC.spot || {}).plays || 0) + 1, at: Date.now() };
      changed();
      stageS.innerHTML = "";
      var avg = times.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, times.length);
      var c = el("article", "st-card st-sum" + (reduced() ? "" : " in"));
      var mixes = Object.keys(mix);
      c.innerHTML = '<div class="st-sum-mark">' + icon(I.eye) + "</div><h2>" + (score >= 9 ? "Sharp eyes." : score >= 7 ? "Good spotting." : "The patterns are forming.") + "</h2>" +
        '<p class="st-sum-line">' + score + " of " + N + " named · best run " + best + " · " + avg.toFixed(1) + " s a question</p>" +
        (mixes.length ? '<div class="st-mixups"><p><b>You mixed up</b></p><ul>' + mixes.map(function (k) { return "<li>" + esc(k.split(" → ")[0]) + " <span>looked like</span> " + esc(k.split(" → ")[1]) + "</li>"; }).join("") + "</ul></div>" : "");
      var acts = el("div", "st-acts");
      var again = button("st-btn", "<span>Play again</span>");
      again.addEventListener("click", function () { spotter(host, ctx); });
      var home = button("st-btn primary", "<span>Back to your SAT plan</span>" + icon(I.arrow));
      home.addEventListener("click", function () { ctx.go.hub(); });
      acts.appendChild(again); acts.appendChild(home);
      c.appendChild(acts);
      stageS.appendChild(c);
    }
    paintHud();
    intro();
  }

  /* ========================================================= Target score
     Where the points are, for the score being worked toward. It never
     promises a score; it shows which skills the points would come from,
     and builds the path. */
  function targetPage(host, ctx) {
    var page = pageTop(host, ctx, "Target score");
    var est = estimate(), T = REC.target || {};
    var head = el("section", "st-rv-h");
    head.innerHTML = '<span class="st-eyebrow">' + icon(I.target) + "Target score</span><h1>Where are the points?</h1>" +
      '<p class="st-lede">Set where you are and where you want to be. OEdu won\'t promise a score — it will show which skills the points come from, and build the path.</p>';
    page.appendChild(head);
    var form = el("section", "st-card st-tform");
    var now0 = T.now || (est ? est.score : 500), goal0 = T.goal || Math.min(800, Math.round((now0 + 80) / 10) * 10);
    form.innerHTML = '<div class="st-tf"><label for="stNow">Math score now</label><div class="st-tf-in"><input id="stNow" type="number" min="200" max="800" step="10" value="' + now0 + '"><span>' +
      (est ? "your estimate is " + est.score : "a recent test, or a guess") + '</span></div></div>' +
      '<div class="st-tf"><label for="stGoal">Your goal</label><div class="st-tf-in"><input id="stGoal" type="range" min="400" max="800" step="10" value="' + goal0 + '"><b class="st-goalv">' + goal0 + "</b></div></div>" +
      '<div class="st-tf"><label for="stDate">Test date <i>(optional)</i></label><div class="st-tf-in"><input id="stDate" type="date" value="' + esc(T.date || "") + '"></div></div>';
    page.appendChild(form);
    var out = el("section", "st-card st-tout");
    page.appendChild(out);
    var nowIn = form.querySelector("#stNow"), goalIn = form.querySelector("#stGoal"), dateIn = form.querySelector("#stDate");
    function paint() {
      var now1 = clamp(+nowIn.value || 500, 200, 800), goal1 = +goalIn.value;
      form.querySelector(".st-goalv").textContent = goal1;
      var gap = goal1 - now1;
      var ranked = ORDER.map(function (id) { return { id: id, g: gain(id) }; }).sort(function (a, b) { return b.g - a.g; });
      var sum = 0, path = [];
      ranked.forEach(function (r) { if (sum < Math.max(gap, 30) * 1.25 && path.length < 8) { path.push(r); sum += r.g; } });
      var days = dateIn.value ? Math.ceil((new Date(dateIn.value + "T09:00:00") - Date.now()) / DAY) : null;
      var byDom = {};
      path.forEach(function (r) { (byDom[SK[r.id].domain] = byDom[SK[r.id].domain] || []).push(r); });
      out.innerHTML = '<header class="st-card-h">' + icon(I.trend) + "<div><h3>" + (gap <= 0 ? "You're at or above that goal — raise the bar?" : "+" + gap + " points to go") + "</h3><p>" +
        (gap > 0 ? "Your practice profile suggests these skills, most points first. Each is worth up to what's shown." : "Keep skills from slipping with spaced reviews, and push the ones below 80%.") +
        (days != null && days > 0 ? " " + plural(days, "day") + " to test day — about " + Math.max(1, Math.ceil(path.length * 2 / Math.max(1, days / 7))) + " sessions a week covers this list." : "") + "</p></div></header>";
      [1, 2, 3, 4].forEach(function (n) {
        if (!byDom[n]) return;
        var sec = el("div", "st-tpath " + DOMAINS[n].cls);
        sec.innerHTML = '<p class="st-tpath-h">' + icon(DOMAINS[n].glyph) + "<b>" + esc(DOMAINS[n].t) + "</b></p>";
        byDom[n].forEach(function (r) {
          var b = button("st-tp-r", "<span><b>" + esc(SK[r.id].t) + "</b><i>" + (tested(r.id) ? pct(understanding(r.id)) + "% understood" : "not tested") + "</i></span>" +
            '<em>+' + Math.max(5, Math.round(r.g / 5) * 5) + "</em>" + icon(I.arrow));
          b.addEventListener("click", function () { ctx.go.page("Fix/" + r.id); });
          sec.appendChild(b);
        });
        out.appendChild(sec);
      });
      var school = ORDER.filter(function (id) { return tested(id) && understanding(id) < 0.45 && SK[id].school && LAB.has(SK[id].school.course, SK[id].school.unit); }).slice(0, 3);
      if (school.length) {
        var sc = el("div", "st-schoolbox");
        sc.innerHTML = '<p>' + icon(I.school) + "<b>This isn't just an SAT problem.</b> A few of these are foundations from school — shoring them up helps in class too.</p>";
        school.forEach(function (id) {
          var b = button("st-link", esc(SK[id].t) + " → " + esc(SK[id].school.t) + icon(I.arrow));
          b.addEventListener("click", function () { ctx.go.course(SK[id].school.course, SK[id].school.unit); });
          sc.appendChild(b);
        });
        out.appendChild(sc);
      }
    }
    var save = button("st-btn primary", "<span>Save my goal</span>");
    save.addEventListener("click", function () {
      REC.target = { now: clamp(+nowIn.value || 500, 200, 800), goal: +goalIn.value, date: dateIn.value || null, at: Date.now() };
      changed();
      save.innerHTML = icon(I.check) + "<span>Saved</span>";
      setTimeout(function () { save.innerHTML = "<span>Save my goal</span>"; }, 1600);
    });
    form.appendChild(el("div", "st-acts")).appendChild(save);
    [nowIn, goalIn, dateIn].forEach(function (x) { x.addEventListener("input", paint); });
    paint();
  }

  /* ============================================================ Skill page */
  function skillPage(host, ctx, id) {
    var sk = SK[id];
    if (!sk) { renderHub(host, ctx); return; }
    var page = pageTop(host, ctx, null, { cls: "st-skillpage" });
    var s = REC.sk[id] || {}, st = stage(id), u = pct(understanding(id)), D = DOMAINS[sk.domain];
    var head = el("section", "st-sk-h " + D.cls);
    head.innerHTML = '<span class="st-eyebrow">' + icon(D.glyph) + esc(D.t) + "</span><h1>" + esc(sk.t) + "</h1>" + (sk.blurb ? '<p class="st-lede">' + fmt(sk.blurb) + "</p>" : "");
    page.appendChild(head);
    var row = el("div", "st-row2");
    var uc = el("section", "st-card st-sk-u");
    uc.innerHTML = '<span class="st-eyebrow">Understanding</span><div class="st-score-row"><b class="st-score-n">' + (tested(id) ? u + "%" : "—") + "</b>" + statusDot(id) + "</div>" +
      '<p class="st-muted">' + (tested(id) ? plural(s.n, "answer") + ", " + s.ok + " right. " : "Not tested yet. ") + (s.due ? (due(id) ? "<b>A spaced review is due.</b>" : "Next review " + (s.due - Date.now() < DAY ? "within a day" : "in " + Math.ceil((s.due - Date.now()) / DAY) + " days") + ".") : "") + "</p>" +
      '<div class="st-forms"><p class="st-lbl">' + icon(I.mask) + "Disguises solved</p>" + sk.forms.map(function (f) { return '<span class="st-form' + (s.forms && s.forms[f] ? " on" : "") + '">' + (s.forms && s.forms[f] ? icon(I.check) : "") + esc(FORMS[f].t) + "</span>"; }).join("") + "</div>";
    row.appendChild(uc);
    var lc = el("section", "st-card st-sk-loop");
    lc.innerHTML = '<span class="st-eyebrow">' + icon(I.loop) + "The mastery loop</span>" +
      '<ol class="st-loopl">' + STAGES.slice(1).map(function (x, i) { return '<li class="' + (i + 1 <= st ? "on" : i + 1 === st + 1 ? "next" : "") + '"><span class="st-loopn">' + (i + 1 <= st ? icon(I.check) : i + 1) + "</span><b>" + esc(x.t) + "</b><i>" + esc(x.s) + "</i></li>"; }).join("") + "</ol>" +
      '<p class="st-muted">' + (st >= 7 ? "Mastered — it stuck. Reviews keep it that way." : (st ? "Next: " : "") + esc(stageNext(st).charAt(0).toUpperCase() + stageNext(st).slice(1))) + "</p>";
    row.appendChild(lc);
    page.appendChild(row);
    var acts = el("div", "st-acts");
    var fix = button("st-btn primary lg", "<span>Fix this skill — 8 min</span>" + icon(I.arrow));
    fix.addEventListener("click", function () { ctx.go.page("Fix/" + id); });
    var learn = button("st-btn", icon(I.book) + "<span>Just the lesson</span>");
    learn.addEventListener("click", function () { ctx.go.lesson(sk.domain, D.ids.indexOf(id) + 1); });
    var five = button("st-btn", icon(I.bolt) + "<span>5 quick questions</span>");
    five.addEventListener("click", function () { ctx.go.page("Drill/" + id); });
    acts.appendChild(fix); acts.appendChild(learn); acts.appendChild(five);
    page.appendChild(acts);
    var strats = STRATS.filter(function (x) { return (x.skills || []).indexOf(id) > -1; });
    if (strats.length) {
      var sc = el("section", "st-card");
      sc.innerHTML = '<header class="st-card-h">' + icon(I.book) + "<div><h3>Strategies for this skill</h3></div></header>";
      strats.forEach(function (x) {
        var b = button("st-srow", "<b>" + esc(x.t) + "</b><span>" + fmt(x.rule) + "</span>" + icon(I.arrow));
        b.addEventListener("click", function () { ctx.go.page("Library/" + x.id); });
        sc.appendChild(b);
      });
      page.appendChild(sc);
    }
    if (sk.school) {
      // Linked only when that unit's lessons exist; otherwise said plainly.
      var live = LAB.has(sk.school.course, sk.school.unit);
      var sch = el("section", "st-card st-schoolbox");
      sch.innerHTML = "<p>" + icon(I.school) + "<b>SAT → School.</b> This isn't just an SAT skill — it's " + esc(sk.school.t) + ". " +
        (live ? "If the idea itself feels shaky, the course unit builds it from the ground up." : "That unit's lessons are still being written; until they're ready, this skill's own lesson builds the idea from the start.") + "</p>";
      if (live) {
        var b2 = button("st-link", "Open " + esc(sk.school.t) + icon(I.arrow));
        b2.addEventListener("click", function () { ctx.go.course(sk.school.course, sk.school.unit); });
        sch.appendChild(b2);
      }
      page.appendChild(sch);
    }
    var log = REC.log.filter(function (x) { return x.k === id; }).slice(-10).reverse();
    if (log.length) {
      var lc2 = el("section", "st-card st-sk-log");
      lc2.innerHTML = '<header class="st-card-h">' + icon(I.list) + "<div><h3>Recent answers</h3></div></header>" + log.map(function (x) {
        return '<div class="st-lrow ' + (x.ok ? "ok" : "no") + '">' + (x.ok ? icon(I.check) : icon(I.x)) + "<span>" + esc(FORMS[x.f] ? FORMS[x.f].t : "") + " · " + ["", "easy", "medium", "hard"][x.d] + "</span><span>" + mmss(x.t) + "</span><span>" + (x.c != null ? confBars(x.c) : "") + "</span><span>" + ago(x.at) + "</span></div>";
      }).join("");
      page.appendChild(lc2);
    }
  }
  function drillPlan(id) {
    var sk = SK[id];
    var blocks = [0, 1, 2, 3, 4].map(function (k) { return { k: "q", id: id, diff: 1 + Math.min(2, Math.floor(k * 0.6)), form: sk.forms[k % sk.forms.length], group: 0, label: FORMS[sk.forms[k % sk.forms.length]].t }; });
    return { kind: "drill", mins: 7, eyebrow: "5 quick questions", title: sk.t, groups: [{ t: sk.short + " · 5 questions", mins: 7 }], blocks: blocks, focus: id };
  }

  /* ============================================================ The hub's
     pages, by address: SAT-Math, SAT-Math/Scan, …/Mission, …/Time/10,
     …/Fix/<skill>, …/Skill/<skill>, …/Drill/<skill>, …/Module(/Full),
     …/Errors(/<n>), …/Library(/<id>), …/Try/<id>, …/Spot, …/Target,
     …/Results. Every domain file is loaded first — the scan and the map need
     every skill. */
  function route(host, ctx, what) {
    var seg = String(what || "").split("/"), a = seg[0], b = seg[1];
    TOOLS.close();
    if (!a) return renderHub(host, ctx);
    if (a === "Scan") return scanIntro(host, ctx, b === "Quick" ? "quick" : "full");
    if (a === "Results") return REC.scan ? reveal(host, ctx, false) : renderHub(host, ctx);
    if (a === "Mission") return runSession(host, ctx, Object.assign(buildPlan(20, { kind: "mission", eyebrow: "Today's mission" }), { again: null }));
    if (a === "Time" && +b) return runSession(host, ctx, buildPlan(+b, {}));
    if (a === "Fix" && SK[b]) return runSession(host, ctx, fixPlan(b));
    if (a === "Drill" && SK[b]) return runSession(host, ctx, drillPlan(b));
    if (a === "Skill" && SK[b]) return skillPage(host, ctx, b);
    if (a === "Module") return runModule(host, ctx, b === "Full" ? "full" : "one");
    if (a === "Errors") return b != null && b !== "" ? labReview(host, ctx, +b) : errorLab(host, ctx);
    if (a === "Library") return library(host, ctx, b);
    if (a === "Try") { var p = strategyPlan(b); return p ? runSession(host, ctx, p) : library(host, ctx); }
    if (a === "Spot") return spotter(host, ctx);
    if (a === "Target") return targetPage(host, ctx);
    return renderHub(host, ctx);
  }
  LAB.addHub("sat", function (host, ctx, what) {
    useAccount(ctx.me);
    host.innerHTML = '<div class="lb-loading"><span></span><span></span><span></span></div>';
    // A domain whose file is missing or broken leaves the others working.
    return Promise.all([1, 2, 3, 4].map(function (n) {
      return LAB.has("sat", n) ? LAB.load("sat", n).catch(function (e) { if (window.console) console.error("SAT: domain " + n + " didn't load", e); }) : null;
    })).then(function () {
      if (!ORDER.length) throw new Error("No SAT skills could be loaded.");
      route(host, ctx, what);
      // Progress that arrives from another device redraws the hub, never a
      // question in the middle of being answered.
      SAT.onSync(function () { if (!what && host.isConnected && host.querySelector(".st-hub")) renderHub(host, ctx); });
    }, function (e) {
      host.innerHTML = "";
      host.appendChild(el("div", "lb-none", "<b>SAT Math couldn't open.</b><p>" + esc(e && e.message || "Something went wrong loading it.") + "</p>"));
    });
  });
})();
