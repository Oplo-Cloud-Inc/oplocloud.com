/* ==========================================================================
   OEdu Lab — Pathway, the pages. See lab/pathkit.js for what a map is and
   how a check works; path/<course>.js for a course's topics.

     the ring     every slice a part of the course; dark is mastered, light is
                  learned, empty is to come
     placement    the first check: about 28 questions, nothing marked as it
                  goes, and "I haven't learned this yet" is always a fair
                  answer — it is the most useful thing to say when it's true
     next up      the topics whose foundations hold: what to learn now
     learn        the idea, a worked example, then three right answers
     check        every ten topics or two weeks: confirms what was learned and
                  returns anything that has been forgotten
     review       a few topics that are due, one question each
     the map      every topic and what rests on what — nothing locked

   The course's colours are its slices'. Everything else is the app's tokens,
   so the pages sit on the student side's Obsidian and on the light console.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_LAB || !window.OPLO_LAB.PATH) return;
  var LAB = window.OPLO_LAB, P = LAB.PATH;
  var el = LAB.el, esc = LAB.esc;
  var NS = "http://www.w3.org/2000/svg";
  var DAY = 86400000;

  /* ============================================================== Helpers */
  function icon(d, cls) {
    return '<svg class="pw-i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }
  var I = {
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    back: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="m7 7 10 10M17 7 7 17"/>',
    map: '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3 2-5.2 3.4-6.6.3 1.6 1.2 2.7 2.3 3.2-.4-3 .9-5.9 3.3-7.9.2 2.8 1.7 4.4 3 6 1 1.3 1.5 3 1.5 4.9 0 4-2.9 6.6-7 6.6z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    play: '<path d="M8 5.5 18 12 8 18.5z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    ring: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v8.5h8.5"/>'
  };
  function fmt(t) { return LAB.fmt(t); }
  function reduced() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function focusSoon(n) { requestAnimationFrame(function () { if (n && n.focus) n.focus({ preventScroll: true }); }); }
  function toTop() { window.scrollTo({ top: 0, behavior: "auto" }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var styleEl = null;
  function css(text) {
    if (!styleEl) {
      var old = document.getElementById("pathkit-css");
      if (old) old.remove();
      styleEl = document.createElement("style");
      styleEl.id = "pathkit-css";
      document.head.appendChild(styleEl);
    }
    styleEl.appendChild(document.createTextNode(Array.isArray(text) ? text.join("\n") : text));
  }

  /* What a typed answer looks like set as math, while it is being typed. */
  function texOf(raw) {
    var s = String(raw);
    for (var g = 0; g < 4; g++) s = s.replace(/sqrt\(([^()]*)\)/g, "\\sqrt{$1}");
    s = s.replace(/sqrt/g, "\\sqrt").replace(/\bpi\b/g, "\\pi").replace(/<=/g, "\\le ").replace(/>=/g, "\\ge ")
      .replace(/\*/g, "\\cdot ").replace(/\^\(([^()]*)\)/g, "^{$1}").replace(/\^(-?\d+)/g, "^{$1}");
    for (g = 0; g < 3; g++) s = s.replace(/\(([^()]*)\)\/\(([^()]*)\)/g, "\\frac{$1}{$2}");
    s = s.replace(/(-?\d+)\/(\d+)/g, function (m, a, b) { return "\\frac{" + a + "}{" + b + "}"; });
    return s;
  }
  function typeset(raw) { try { return LAB.m(texOf(raw)); } catch (e) { return esc(raw); } }

  /* The right answer, written the way a student would type it. */
  function ansText(a) {
    function n(v) {
      if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
      for (var q = 2; q <= 60; q++) if (Math.abs(v * q - Math.round(v * q)) < 1e-9) return LAB.fracText(Math.round(v * q), q);
      return String(Math.round(v * 100) / 100);
    }
    switch (a.k) {
      case "num": return a.tol && a.abs ? String(Math.round(a.v * 100) / 100) : n(a.v);
      case "list": return a.v.map(function (v) { return a.abs ? String(Math.round(v * 100) / 100) : n(v); }).join(", ");
      case "pt": return "(" + a.v.map(n).join(", ") + ")";
      case "choice": return a.opts[a.ok].t;
      default: return a.v;
    }
  }
  function ansHTML(a) {
    if (a.k === "choice") return fmt(String(a.opts[a.ok].t));
    var t = ansText(a);
    if (a.k === "num" || a.k === "list" || a.k === "pt") return typeset(t);
    return typeset(t);
  }

  /* ========================================================== One question
     The stem, its picture, and a way to answer: choices, or a box for what a
     person would type — a number, a list, a point, an expression, an
     equation, an inequality. */
  var PLACE = { num: "a number, like 3/4 or -2", list: "answers separated by commas, like 2, -3", pt: "a point, like (2, -3)",
                expr: "an expression, like 3x + 2", eq: "an equation, like y = 2x + 3", rel: "an inequality, like x > 3" };
  var PAL = {
    expr: [["x²", "^2"], ["xⁿ", "^"], ["√", "sqrt("], ["π", "pi"], ["( )", "()"]],
    eq: [["x²", "^2"], ["xⁿ", "^"], ["√", "sqrt("], ["( )", "()"]],
    rel: [["<", "<"], [">", ">"], ["≤", "<="], ["≥", ">="]],
    num: [["√", "sqrt("], ["π", "pi"]]
  };
  function questionView(item, o) {
    o = o || {};
    var a = item.a, box = el("div", "pw-q"), chosen = null, input = null;
    box.appendChild(el("div", "pw-stem", fmt(item.q)));
    if (item.fig) box.appendChild(el("div", "pw-fig", item.fig));
    var ans = el("div", "pw-ans");
    var api = { node: box, locked: false };
    if (a.k === "choice") {
      var opts = el("div", "pw-opts"), btns = [];
      a.opts.forEach(function (op, i) {
        var b = el("button", "pw-opt", '<span class="pw-l">' + "ABCDEF".charAt(i) + "</span><span class=\"pw-t\">" + fmt(String(op.t)) + "</span>");
        b.type = "button";
        b.addEventListener("click", function () { if (api.locked) return; chosen = i; btns.forEach(function (x, j) { x.classList.toggle("on", j === i); x.setAttribute("aria-pressed", j === i ? "true" : "false"); }); if (o.onChange) o.onChange(); });
        btns.push(b); opts.appendChild(b);
      });
      ans.appendChild(opts);
      api.judge = function () {
        if (chosen == null) return { empty: true };
        return chosen === a.ok ? { ok: true } : { ok: false, why: a.opts[chosen].why || "", chosen: chosen };
      };
      api.reveal = function (right) {
        btns.forEach(function (b, i) { b.classList.toggle("right", i === a.ok); if (i === chosen && !right) b.classList.add("wrong"); });
      };
      api.focus = function () { if (btns[0]) focusSoon(btns[0]); };
      api.key = function (e) {
        var k = e.key;
        if (/^[1-9]$/.test(k) && +k <= btns.length) { btns[+k - 1].click(); e.preventDefault(); return true; }
        return false;
      };
      api.value = function () { return chosen; };
    } else {
      var wrap = el("label", "pw-inp");
      input = el("input");
      input.type = "text"; input.autocomplete = "off"; input.spellcheck = false; input.setAttribute("autocapitalize", "off"); input.setAttribute("autocorrect", "off");
      input.placeholder = "Type " + (PLACE[a.k] || "your answer");
      input.setAttribute("aria-label", "Your answer");
      wrap.appendChild(input);
      if (item.unit) wrap.appendChild(el("span", "pw-unit", esc(item.unit)));
      ans.appendChild(wrap);
      var prev = el("div", "pw-prev");
      prev.setAttribute("aria-live", "polite");
      ans.appendChild(prev);
      function upd() { var v = input.value.trim(); prev.innerHTML = v ? typeset(v) : ""; prev.classList.toggle("on", !!v); if (o.onChange) o.onChange(); }
      input.addEventListener("input", upd);
      var pal = PAL[a.k];
      if (pal) {
        var row = el("div", "pw-pal");
        pal.forEach(function (p) {
          var b = el("button", null, esc(p[0])); b.type = "button"; b.tabIndex = -1; b.title = "Insert " + p[1];
          b.addEventListener("click", function () {
            if (api.locked) return;
            var s = input.selectionStart, e = input.selectionEnd, v = input.value, ins = p[1];
            input.value = v.slice(0, s) + ins + v.slice(e);
            var caret = s + (ins === "()" ? 1 : ins.length);
            input.focus(); input.setSelectionRange(caret, caret); upd();
          });
          row.appendChild(b);
        });
        ans.appendChild(row);
      }
      api.judge = function () { return P.judge(a, input.value); };
      api.reveal = function (right) { input.classList.toggle("right", !!right); input.classList.toggle("wrong", !right); };
      api.focus = function () { focusSoon(input); };
      api.key = function () { return false; };
      api.value = function () { return input.value; };
      api.input = input;
    }
    box.appendChild(ans);
    api.lock = function () { api.locked = true; box.classList.add("locked"); if (input) input.readOnly = true; box.querySelectorAll("button").forEach(function (b) { b.disabled = true; }); };
    return api;
  }

  /* The worked solution: each step is some math and the reason for it. */
  function walkView(walk, o) {
    o = o || {};
    var ol = el("ol", "pw-walk");
    walk.forEach(function (s, i) {
      var li = el("li", o.stepwise && i > 0 ? "pw-hide" : "in");
      li.innerHTML = '<div class="pw-wm">' + LAB.m(s[0]) + '</div><div class="pw-wy">' + fmt(s[1]) + "</div>";
      ol.appendChild(li);
    });
    return ol;
  }
  /* A wrong answer that matches a mistake we know about gets its own remark. */
  function knownMistake(item, raw) {
    if (!item.fb || !item.fb.length) return "";
    var a = item.a, v = null;
    if (a.k === "num") v = P.readNum(raw);
    if (v == null) return "";
    for (var i = 0; i < item.fb.length; i++) {
      var f = item.fb[i];
      if (typeof f.v === "number" && Math.abs(f.v - v) < 1e-6) return f.say;
    }
    return "";
  }
  function pointMistake(item, raw) {
    if (!item.fb || item.a.k !== "pt") return "";
    var m = /\(?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)?/.exec(String(raw));
    if (!m) return "";
    for (var i = 0; i < item.fb.length; i++) {
      var f = item.fb[i];
      if (Array.isArray(f.v) && Math.abs(f.v[0] - +m[1]) < 1e-6 && Math.abs(f.v[1] - +m[2]) < 1e-6) return f.say;
    }
    return "";
  }

  /* ================================================================ Look */
  css([
    ".pw-root, .pw-q, .pw-toast { --pw-good: #12a15f; --pw-mid: #e0a100; --pw-low: #e5484d; --pw-line: color-mix(in srgb, var(--ink) 11%, transparent); --pw-r: 22px; }",
    "html[data-look=\"obsidian\"] .pw-root, html[data-look=\"obsidian\"] .pw-q { --pw-good: #3ddc84; --pw-mid: #ffc53d; --pw-low: #ff6b6e; }",
    ".pw-root { font-family: var(--text); color: var(--ink); }",
    ".pw-root button, .pw-q button { font: inherit; color: inherit; cursor: pointer; }",
    ".pw-i { width: 18px; height: 18px; flex: none; }",
    ".lx-wrap:has(#v-course.on .pw-page), .lx-wrap:has(#v-lab.on .pw-page) { max-width: 1120px; }",
    ".pw-page { display: grid; gap: 22px; padding-bottom: 56px; }",
    ".pw-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; letter-spacing: .01em; color: var(--ink-3); }",
    ".pw-h1 { font-family: var(--font); font-size: clamp(32px, 4.2vw, 46px); line-height: 1.04; font-weight: 700; letter-spacing: -.025em; margin: 6px 0 0; }",
    ".pw-lede { font-size: 17px; line-height: 1.55; color: var(--ink-2); margin: 10px 0 0; max-width: 60ch; }",
    ".pw-muted { color: var(--ink-3); font-size: 13.5px; line-height: 1.5; margin: 0; }",
    ".pw-h2 { font-family: var(--font); font-size: 22px; font-weight: 700; letter-spacing: -.012em; margin: 14px 0 0; }",
    ".pw-sub { color: var(--ink-3); margin: 3px 0 0; font-size: 14px; }",
    ".pw-card { background: var(--paper); border-radius: var(--pw-r); padding: 24px 26px; box-shadow: 0 0 0 1px var(--hair); min-width: 0; }",
    ".pw-lbl { font-size: 12px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; color: var(--ink-3); margin: 0 0 10px; display: flex; align-items: center; gap: 6px; }",
    ".pw-lbl .pw-i { width: 14px; height: 14px; }",
    /* buttons */
    ".pw-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 42px; padding: 0 20px; border-radius: 999px; background: var(--sunk); font-weight: 600; font-size: 14.5px; border: 0; transition: background .15s var(--ease), transform .12s var(--ease), opacity .15s; white-space: nowrap; }",
    ".pw-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--ink) 12%, var(--paper)); }",
    ".pw-btn:active:not(:disabled) { transform: scale(.98); }",
    ".pw-btn:disabled { opacity: .4; cursor: default; }",
    ".pw-btn.primary { background: var(--blue); color: #fff; }",
    "html[data-look=\"obsidian\"] .pw-btn.primary { background: var(--fill, #0071e3); }",
    ".pw-btn.primary:hover:not(:disabled) { background: var(--blue-d); }",
    "html[data-look=\"obsidian\"] .pw-btn.primary:hover:not(:disabled) { background: var(--fill-d, #0068d6); }",
    ".pw-btn.lg { height: 52px; padding: 0 28px; font-size: 16px; }",
    ".pw-btn.sm { height: 34px; padding: 0 14px; font-size: 13.5px; }",
    ".pw-btn.ghost { background: transparent; box-shadow: inset 0 0 0 1px var(--rule); }",
    ".pw-btn .pw-i { width: 17px; height: 17px; }",
    ".pw-link { background: none; border: 0; padding: 4px 0; color: var(--blue); font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }",
    ".pw-link:hover { text-decoration: underline; }",
    ".pw-btn:focus-visible, .pw-opt:focus-visible, .pw-chip:focus-visible, .pw-link:focus-visible, .pw-node:focus-visible, .pw-slice:focus-visible { outline: 3px solid color-mix(in srgb, var(--blue) 55%, transparent); outline-offset: 2px; }",
    ".pw-acts { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 18px; }",
    ".pw-acts.center { justify-content: center; }",
    ".in { animation: pw-in .42s cubic-bezier(.2,.7,.2,1) both; }",
    "@keyframes pw-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }",
    /* the top of the home page */
    ".pw-top { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 22px; align-items: start; }",
    "@media (max-width: 980px) { .pw-top { grid-template-columns: 1fr; } }",
    ".pw-ringcard { padding: 26px 26px 20px; }",
    ".pw-bigpct { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }",
    ".pw-bigpct b { font-family: var(--font); font-size: 64px; line-height: 1; font-weight: 700; letter-spacing: -.035em; }",
    ".pw-bigpct span { font-size: 15px; color: var(--ink-2); }",
    ".pw-legend { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 10px 0 2px; font-size: 13px; color: var(--ink-2); }",
    ".pw-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 4px; margin-right: 7px; vertical-align: -1px; background: var(--ink-2); }",
    ".pw-legend i.l { opacity: .42; } .pw-legend i.n { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ink-3); }",
    ".pw-ringwrap { position: relative; margin: 2px auto 0; max-width: 560px; }",
    ".pw-ring { width: 100%; height: auto; display: block; overflow: visible; }",
    ".pw-ring .pw-bg { fill: color-mix(in srgb, var(--ink) 7%, transparent); stroke: var(--hair); stroke-width: 1; }",
    ".pw-ring .pw-fl { opacity: .42; } .pw-ring .pw-fm { opacity: 1; }",
    ".pw-ring .pw-slice { cursor: pointer; outline: none; transition: transform .25s var(--ease); transform-origin: 0 0; }",
    ".pw-ring .pw-slice:hover, .pw-ring .pw-slice:focus-visible, .pw-ring .pw-slice.on { transform: translate(var(--tx), var(--ty)); }",
    ".pw-ring text { font-family: var(--text); font-size: 12.5px; font-weight: 600; fill: var(--ink-2); pointer-events: none; }",
    ".pw-ring text.n { font-weight: 500; fill: var(--ink-3); font-size: 11.5px; }",
    ".pw-tip { position: absolute; left: 50%; bottom: 6px; transform: translateX(-50%); background: color-mix(in srgb, var(--ink) 92%, transparent); color: var(--paper); font-size: 12.5px; font-weight: 600; padding: 5px 12px; border-radius: 99px; opacity: 0; pointer-events: none; transition: opacity .15s; white-space: nowrap; }",
    ".pw-tip.on { opacity: 1; }",
    ".pw-side { display: grid; gap: 18px; }",
    /* hero (before the first check) */
    ".pw-hero { padding: 30px 30px 28px; background: linear-gradient(160deg, color-mix(in srgb, var(--blue) 14%, var(--paper)), var(--paper) 60%); }",
    ".pw-hero h2 { font-family: var(--font); font-size: 28px; line-height: 1.12; letter-spacing: -.02em; margin: 6px 0 10px; font-weight: 700; }",
    ".pw-hero p { color: var(--ink-2); font-size: 15.5px; line-height: 1.55; margin: 0 0 6px; }",
    ".pw-hero ul { margin: 12px 0 4px; padding: 0; list-style: none; display: grid; gap: 9px; }",
    ".pw-hero li { display: flex; gap: 10px; align-items: flex-start; font-size: 14.5px; color: var(--ink-2); line-height: 1.45; }",
    ".pw-hero li .pw-i { width: 17px; height: 17px; color: var(--blue); margin-top: 2px; }",
    /* next up */
    ".pw-next { display: grid; gap: 9px; }",
    ".pw-nx { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; gap: 13px; align-items: center; text-align: left; width: 100%; background: var(--sunk); border: 0; border-radius: 16px; padding: 13px 16px; transition: background .15s var(--ease), transform .12s var(--ease); }",
    ".pw-nx:hover { background: color-mix(in srgb, var(--ink) 11%, var(--paper)); }",
    ".pw-nx:active { transform: scale(.99); }",
    ".pw-nx .d { width: 10px; height: 10px; border-radius: 50%; background: var(--h); }",
    ".pw-nx b { display: block; font-size: 15px; font-weight: 600; letter-spacing: -.005em; line-height: 1.25; }",
    ".pw-nx small { display: block; color: var(--ink-3); font-size: 12.5px; margin-top: 2px; }",
    ".pw-nx .pw-i { color: var(--ink-3); width: 17px; height: 17px; }",
    ".pw-nx.now { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--h) 60%, transparent); }",
    ".pw-nowtag { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--h); margin-left: 8px; }",
    ".pw-notice { display: flex; gap: 14px; align-items: center; }",
    ".pw-notice .pw-i { width: 34px; height: 34px; padding: 8px; border-radius: 11px; background: color-mix(in srgb, var(--blue) 14%, transparent); color: var(--blue); flex: none; }",
    ".pw-notice > div { flex: 1; min-width: 0; }",
    ".pw-notice b { display: block; font-size: 15.5px; font-weight: 650; letter-spacing: -.005em; }",
    ".pw-notice p { margin: 2px 0 0; font-size: 13.5px; color: var(--ink-3); line-height: 1.45; }",
    ".pw-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }",
    ".pw-stat { background: var(--sunk); border-radius: 16px; padding: 14px 16px; }",
    ".pw-stat b { display: block; font-family: var(--font); font-size: 26px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }",
    ".pw-stat span { display: block; font-size: 12px; color: var(--ink-3); margin-top: 6px; }",
    /* slices list */
    ".pw-cat { background: var(--paper); border-radius: 20px; box-shadow: 0 0 0 1px var(--hair); overflow: hidden; }",
    ".pw-cat-h { display: grid; grid-template-columns: 12px minmax(0, 1fr) minmax(90px, 200px) 56px 20px; gap: 14px; align-items: center; width: 100%; padding: 16px 22px; background: none; border: 0; text-align: left; }",
    ".pw-cat-h .d { width: 12px; height: 12px; border-radius: 4px; background: var(--h); }",
    ".pw-cat-h b { font-size: 16px; font-weight: 650; letter-spacing: -.005em; display: block; }",
    ".pw-cat-h small { color: var(--ink-3); font-size: 12.5px; display: block; margin-top: 1px; }",
    ".pw-cat-h .pw-i { color: var(--ink-3); width: 17px; height: 17px; transition: transform .2s var(--ease); }",
    ".pw-cat.open .pw-cat-h .pw-i { transform: rotate(180deg); }",
    ".pw-cat-h .ct { font-size: 13px; color: var(--ink-2); text-align: right; font-variant-numeric: tabular-nums; }",
    ".pw-bar { position: relative; display: block; height: 7px; border-radius: 99px; background: var(--sunk); overflow: hidden; }",
    ".pw-bar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: inherit; background: var(--h); }",
    ".pw-bar i.l { opacity: .4; }",
    ".pw-cat-b { display: none; padding: 2px 22px 20px 48px; }",
    ".pw-cat.open .pw-cat-b { display: block; animation: pw-in .3s var(--ease) both; }",
    ".pw-chips { display: flex; flex-wrap: wrap; gap: 8px; }",
    ".pw-chip { display: inline-flex; align-items: center; gap: 7px; min-height: 34px; padding: 6px 14px; border-radius: 99px; border: 0; background: var(--sunk); font-size: 13.5px; font-weight: 550; color: var(--ink-2); text-align: left; transition: transform .12s var(--ease), background .15s; }",
    ".pw-chip:hover { transform: translateY(-1px); background: color-mix(in srgb, var(--ink) 10%, var(--paper)); }",
    ".pw-chip.m { background: var(--h); color: #fff; }",
    "html[data-look=\"obsidian\"] .pw-chip.m { color: #06131a; }",
    ".pw-chip.l { background: color-mix(in srgb, var(--h) 34%, transparent); color: var(--ink); }",
    ".pw-chip.r { box-shadow: inset 0 0 0 1.5px var(--h); color: var(--ink); background: transparent; }",
    ".pw-chip .pw-i { width: 14px; height: 14px; }",
    /* the learning and check pages */
    ".pw-narrow { max-width: 780px; width: 100%; margin: 0 auto; display: grid; gap: 18px; }",
    ".pw-stage { display: grid; gap: 18px; }",
    ".pw-top2 { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }",
    ".pw-pill { display: inline-flex; align-items: center; height: 24px; padding: 0 11px; border-radius: 99px; font-size: 12px; font-weight: 650; background: var(--sunk); color: var(--ink-2); }",
    ".pw-pill.m { color: var(--pw-good); background: color-mix(in srgb, var(--pw-good) 14%, transparent); }",
    ".pw-pill.l { color: var(--pw-mid); background: color-mix(in srgb, var(--pw-mid) 16%, transparent); }",
    ".pw-pill.r { color: var(--blue); background: color-mix(in srgb, var(--blue) 14%, transparent); }",
    ".pw-tabs { display: inline-flex; padding: 3px; border-radius: 99px; background: var(--sunk); gap: 2px; }",
    ".pw-tabs button { border: 0; background: none; height: 32px; padding: 0 18px; border-radius: 99px; font-size: 13.5px; font-weight: 600; color: var(--ink-3); }",
    ".pw-tabs button.on { background: var(--paper); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.18), 0 0 0 1px var(--hair); }",
    ".pw-pre { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; color: var(--ink-3); }",
    ".pw-idea { font-size: 16.5px; line-height: 1.6; color: var(--ink-2); margin: 0; }",
    ".pw-idea b { color: var(--ink); }",
    ".pw-walk { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 0; counter-reset: s; }",
    ".pw-walk li { position: relative; padding: 12px 0 12px 44px; border-top: 1px solid var(--hair); counter-increment: s; }",
    ".pw-walk li::before { content: counter(s); position: absolute; left: 0; top: 13px; width: 26px; height: 26px; border-radius: 50%; background: var(--sunk); color: var(--ink-3); font-size: 12.5px; font-weight: 700; display: grid; place-items: center; }",
    ".pw-wm { font-size: 19px; line-height: 1.5; }",
    ".pw-wy { margin-top: 3px; color: var(--ink-3); font-size: 14px; line-height: 1.5; }",
    ".pw-hide { display: none; }",
    ".pw-q { position: relative; width: 100%; background: var(--paper); border-radius: 24px; padding: 26px 30px 26px; box-shadow: 0 0 0 1px var(--hair); }",
    ".pw-stem { font-size: 19px; line-height: 1.6; min-width: 0; }",
    ".pw-stem .m { font-size: 1.08em; }",
    ".pw-sys { display: grid; gap: 6px; margin: 12px 0 2px; padding: 12px 20px; border-left: 3px solid var(--rule); font-size: 1.05em; width: fit-content; }",
    ".pw-fig { display: flex; justify-content: center; margin: 16px 0 4px; }",
    ".pw-plane { width: 290px; height: auto; overflow: visible; }",
    ".pw-plane .g { stroke: var(--hair); stroke-width: 1; } .pw-plane .ax { stroke: var(--ink-3); stroke-width: 1.4; }",
    ".pw-plane .tk { fill: var(--ink-3); font-size: 10px; font-family: var(--text); } .pw-plane .pl { fill: var(--ink); font-size: 13px; font-weight: 700; font-family: var(--text); }",
    ".pw-plane .ln { stroke: var(--blue); stroke-width: 2.4; stroke-linecap: round; } .pw-plane .ln.b { stroke: #ff7a9c; }",
    ".pw-plane .pt { fill: var(--blue); stroke: var(--paper); stroke-width: 2; }",
    ".pw-ans { margin-top: 20px; }",
    ".pw-inp { display: flex; align-items: center; gap: 10px; max-width: 460px; }",
    ".pw-inp input { flex: 1; min-width: 0; height: 52px; padding: 0 18px; border-radius: 15px; border: 0; background: var(--sunk); color: var(--ink); font-size: 20px; font-family: var(--text); box-shadow: inset 0 0 0 1.5px transparent; transition: box-shadow .15s; outline: none; }",
    ".pw-inp input:focus { box-shadow: inset 0 0 0 2px var(--blue); }",
    ".pw-inp input.right { box-shadow: inset 0 0 0 2px var(--pw-good); } .pw-inp input.wrong { box-shadow: inset 0 0 0 2px var(--pw-low); }",
    ".pw-unit { color: var(--ink-3); font-size: 15px; }",
    ".pw-prev { min-height: 0; height: 0; overflow: hidden; opacity: 0; font-size: 20px; padding: 0 4px; transition: opacity .15s, height .15s; }",
    ".pw-prev.on { height: 40px; opacity: 1; display: flex; align-items: center; color: var(--ink-2); }",
    ".pw-pal { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }",
    ".pw-pal button { height: 32px; min-width: 40px; padding: 0 12px; border-radius: 10px; border: 0; background: var(--sunk); color: var(--ink-2); font-size: 14.5px; font-weight: 600; }",
    ".pw-pal button:hover { background: color-mix(in srgb, var(--ink) 12%, var(--paper)); }",
    ".pw-opts { display: grid; gap: 10px; }",
    ".pw-opt { display: flex; align-items: center; gap: 14px; text-align: left; width: 100%; padding: 13px 16px; border-radius: 16px; border: 0; background: var(--sunk); font-size: 17px; line-height: 1.45; transition: background .15s, box-shadow .15s, transform .12s; }",
    ".pw-opt:hover:not(:disabled) { background: color-mix(in srgb, var(--ink) 11%, var(--paper)); }",
    ".pw-opt.on { box-shadow: inset 0 0 0 2px var(--blue); background: color-mix(in srgb, var(--blue) 10%, var(--paper)); }",
    ".pw-opt.right { box-shadow: inset 0 0 0 2px var(--pw-good); background: color-mix(in srgb, var(--pw-good) 12%, var(--paper)); }",
    ".pw-opt.wrong { box-shadow: inset 0 0 0 2px var(--pw-low); background: color-mix(in srgb, var(--pw-low) 10%, var(--paper)); }",
    ".pw-l { flex: none; width: 28px; height: 28px; border-radius: 50%; background: var(--paper); box-shadow: 0 0 0 1px var(--rule); display: grid; place-items: center; font-size: 13px; font-weight: 700; color: var(--ink-2); }",
    ".pw-t { min-width: 0; }",
    ".pw-q.locked .pw-opt { cursor: default; }",
    ".pw-steps { display: flex; gap: 7px; align-items: center; }",
    ".pw-steps i { width: 34px; height: 8px; border-radius: 99px; background: var(--sunk); transition: background .3s var(--ease), transform .3s var(--ease); }",
    ".pw-steps i.on { background: var(--h, var(--pw-good)); }",
    ".pw-steps i.pop { animation: pw-pop .7s var(--ease) both; }",
    "@keyframes pw-pop { 0% { transform: scaleY(.4) scaleX(.6); } 55% { transform: scaleY(1.7) scaleX(1.06); } 100% { transform: none; } }",
    ".pw-verdict { margin-top: 18px; padding: 16px 20px; border-radius: 18px; display: grid; gap: 6px; animation: pw-in .3s var(--ease) both; }",
    ".pw-verdict b { font-size: 16.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; }",
    ".pw-verdict p { margin: 0; font-size: 14.5px; line-height: 1.55; color: var(--ink-2); }",
    ".pw-verdict.good { background: color-mix(in srgb, var(--pw-good) 13%, transparent); } .pw-verdict.good b { color: var(--pw-good); }",
    ".pw-verdict.bad { background: color-mix(in srgb, var(--pw-low) 11%, transparent); } .pw-verdict.bad b { color: var(--pw-low); }",
    ".pw-verdict.note { background: var(--sunk); }",
    ".pw-verdict .pw-i { width: 19px; height: 19px; }",
    ".pw-hint { margin-top: 14px; padding: 12px 16px; border-radius: 14px; background: color-mix(in srgb, var(--pw-mid) 13%, transparent); color: var(--ink-2); font-size: 14.5px; line-height: 1.5; animation: pw-in .3s var(--ease) both; display: flex; gap: 10px; }",
    ".pw-hint .pw-i { color: var(--pw-mid); margin-top: 1px; width: 17px; height: 17px; }",
    /* check */
    ".pw-chk-head { display: flex; align-items: center; gap: 16px; }",
    ".pw-prog { flex: 1; height: 6px; border-radius: 99px; background: var(--sunk); overflow: hidden; }",
    ".pw-prog i { display: block; height: 100%; width: 0; background: var(--blue); border-radius: inherit; transition: width .5s var(--ease); }",
    ".pw-chk-n { font-size: 13px; font-weight: 600; color: var(--ink-3); font-variant-numeric: tabular-nums; white-space: nowrap; }",
    ".pw-dk { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 22px; }",
    ".pw-dk .note { font-size: 13px; color: var(--ink-3); max-width: 46ch; line-height: 1.45; }",
    ".pw-res { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; align-items: start; }",
    "@media (max-width: 900px) { .pw-res { grid-template-columns: 1fr; } }",
    ".pw-delta { display: flex; gap: 12px; flex-wrap: wrap; margin: 4px 0 0; }",
    ".pw-delta .pw-stat { flex: 1; min-width: 120px; }",
    ".pw-list { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }",
    ".pw-list li { display: flex; gap: 10px; align-items: center; font-size: 14.5px; color: var(--ink-2); }",
    ".pw-list li i { width: 9px; height: 9px; border-radius: 50%; background: var(--h); flex: none; }",
    /* map */
    ".pw-map { position: relative; overflow: auto; padding: 22px; border-radius: 22px; background: var(--paper); box-shadow: 0 0 0 1px var(--hair); }",
    ".pw-map-in { position: relative; }",
    ".pw-map svg { position: absolute; left: 0; top: 0; pointer-events: none; overflow: visible; }",
    ".pw-map path { fill: none; stroke: color-mix(in srgb, var(--ink) 16%, transparent); stroke-width: 1.2; transition: stroke .2s, opacity .2s; }",
    ".pw-map path.hot { stroke: var(--blue); stroke-width: 2; }",
    ".pw-map.hov path:not(.hot) { opacity: .25; }",
    ".pw-node { position: absolute; display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px; border-radius: 99px; border: 0; background: var(--sunk); font-size: 12.5px; font-weight: 600; color: var(--ink-2); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; transition: transform .12s var(--ease), opacity .2s, box-shadow .2s; text-align: left; }",
    ".pw-node span { overflow: hidden; text-overflow: ellipsis; }",
    ".pw-node.m { background: var(--h); color: #fff; } html[data-look=\"obsidian\"] .pw-node.m { color: #06131a; }",
    ".pw-node.l { background: color-mix(in srgb, var(--h) 34%, transparent); color: var(--ink); }",
    ".pw-node.r { box-shadow: inset 0 0 0 1.5px var(--h); background: transparent; color: var(--ink); }",
    ".pw-map.hov .pw-node:not(.hot) { opacity: .35; }",
    ".pw-node:hover { transform: translateY(-1px); }",
    ".pw-lane { position: absolute; left: 0; right: 0; border-radius: 14px; background: color-mix(in srgb, var(--h) 5%, transparent); }",
    ".pw-lane-l { position: absolute; left: 12px; font-size: 11.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: color-mix(in srgb, var(--h) 75%, var(--ink-3)); }",
    ".pw-map-key { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; color: var(--ink-2); }",
    ".pw-map-key i { display: inline-block; width: 22px; height: 12px; border-radius: 99px; margin-right: 7px; vertical-align: -1px; background: var(--ink-2); }",
    ".pw-map-key i.l { opacity: .4; } .pw-map-key i.r { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ink-2); } .pw-map-key i.n { background: var(--sunk); }",
    ".pw-toast { position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%); z-index: 50; background: var(--ink); color: var(--paper); padding: 11px 20px; border-radius: 99px; font-size: 14px; font-weight: 600; box-shadow: 0 12px 30px rgba(0,0,0,.28); animation: pw-in .3s var(--ease) both; }",
    ".pw-loading { display: grid; place-items: center; min-height: 240px; color: var(--ink-3); }",
    "@media (prefers-reduced-motion: reduce) { .in, .pw-verdict, .pw-hint, .pw-cat.open .pw-cat-b { animation: none; } .pw-steps i.pop { animation: none; } }"
  ]);

  /* ================================================================= Ring */
  function polar(cx, cy, r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function wedge(cx, cy, r, a0, a1) {
    if (r < 0.5) return "";
    var p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1), big = a1 - a0 > Math.PI ? 1 : 0;
    return "M" + cx + " " + cy + "L" + p0[0].toFixed(2) + " " + p0[1].toFixed(2) + "A" + r + " " + r + " 0 " + big + " 1 " + p1[0].toFixed(2) + " " + p1[1].toFixed(2) + "Z";
  }
  function svgEl(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  /* Slices sized by how many topics they hold; each filled outward from the
     centre by the share of it that is known (area, not radius, so a half-known
     slice looks half-full). */
  function drawRing(host, cid, o) {
    o = o || {};
    var def = P.get(cid), cc = P.catCounts(cid), total = def.topics.length;
    var R0 = 150, W = 560, Hh = 410, cx = W / 2, cy = Hh / 2;
    host.innerHTML = "";
    var svg = svgEl("svg", { "class": "pw-ring", viewBox: "0 0 " + W + " " + Hh, role: "img", "aria-label": "Your progress in " + def.title });
    var g = svgEl("g", { transform: "translate(" + cx + " " + cy + ")" });
    svg.appendChild(g);
    var a = -Math.PI / 2, gap = 0.028, slices = [];
    cc.forEach(function (c) {
      var span = (c.n / total) * Math.PI * 2, a0 = a + gap / 2, a1 = a + span - gap / 2, mid = (a0 + a1) / 2;
      slices.push({ c: c, a0: a0, a1: a1, mid: mid });
      a += span;
    });
    var tip = el("div", "pw-tip");
    slices.forEach(function (s) {
      var c = s.c, hue = c.cat.hue;
      var grp = svgEl("g", { "class": "pw-slice", tabindex: "0", role: "button", "aria-label": c.cat.name + ": " + c.m + " mastered, " + c.l + " learned, of " + c.n });
      var d = polar(0, 0, 7, s.mid);
      grp.style.setProperty("--tx", d[0] + "px"); grp.style.setProperty("--ty", d[1] + "px");
      grp.appendChild(svgEl("path", { "class": "pw-bg", d: wedge(0, 0, R0, s.a0, s.a1) }));
      var pl = svgEl("path", { "class": "pw-fl", fill: hue, d: "" }), pm = svgEl("path", { "class": "pw-fm", fill: hue, d: "" });
      grp.appendChild(pl); grp.appendChild(pm);
      s.pl = pl; s.pm = pm;
      var lp = polar(0, 0, R0 + 20, s.mid), right = Math.cos(s.mid) >= -0.08;
      var t1 = svgEl("text", { x: lp[0].toFixed(1), y: (lp[1] - 1).toFixed(1), "text-anchor": Math.abs(Math.cos(s.mid)) < 0.18 ? "middle" : right ? "start" : "end" });
      t1.textContent = (c.cat.short || c.cat.name);
      var t2 = svgEl("text", { "class": "n", x: lp[0].toFixed(1), y: (lp[1] + 13).toFixed(1), "text-anchor": t1.getAttribute("text-anchor") });
      t2.textContent = (c.m + c.l) + " / " + c.n;
      grp.appendChild(t1); grp.appendChild(t2);
      function show() { tip.textContent = c.cat.name + " · " + c.m + " mastered, " + c.l + " learned, " + (c.n - c.m - c.l) + " to go"; tip.classList.add("on"); }
      function hide() { tip.classList.remove("on"); }
      grp.addEventListener("mouseenter", show); grp.addEventListener("focus", show); grp.addEventListener("mouseleave", hide); grp.addEventListener("blur", hide);
      grp.addEventListener("click", function () { if (o.onSlice) o.onSlice(c.cat.id); });
      grp.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (o.onSlice) o.onSlice(c.cat.id); } });
      g.appendChild(grp);
    });
    host.appendChild(svg); host.appendChild(tip);
    function paint(k) {
      slices.forEach(function (s) {
        var c = s.c, from = (o.from && o.from[c.cat.id]) || [0, 0];
        var m = from[0] + (c.m - from[0]) * k, l = from[1] + (c.l - from[1]) * k;
        s.pm.setAttribute("d", wedge(0, 0, R0 * Math.sqrt(clamp(m / c.n, 0, 1)), s.a0, s.a1));
        s.pl.setAttribute("d", wedge(0, 0, R0 * Math.sqrt(clamp((m + l) / c.n, 0, 1)), s.a0, s.a1));
      });
    }
    var same = !o.from || cc.every(function (c) { var f = o.from[c.cat.id]; return f && f[0] === c.m && f[1] === c.l; });
    if (reduced() || same || o.animate === false) { paint(1); return; }
    paint(0);
    var t0 = null;
    function frame(t) {
      if (!svg.isConnected) return;
      if (t0 == null) t0 = t;
      var k = clamp((t - t0) / 1000, 0, 1), e = 1 - Math.pow(1 - k, 3);
      paint(e);
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    // A hidden pane draws no frames; the ring must still end right.
    setTimeout(function () { if (svg.isConnected) paint(1); }, 1300);
  }
  function seenNow(cid) {
    var o = {};
    P.catCounts(cid).forEach(function (c) { o[c.cat.id] = [c.m, c.l]; });
    return o;
  }

  /* ============================================================== Routing */
  var CTX = null;
  function go(what) { if (CTX && CTX.go && CTX.go.page) CTX.go.page(what); }
  /* The rest of OEdu reads a unit's progress as three dials. A slice of the
     ring is a unit: what's known (mastered or learned) fills the first two,
     what a check has confirmed fills the third. They only ever rise. */
  function syncApp(cid) {
    if (!CTX || !CTX.onProgress) return;
    P.catCounts(cid).forEach(function (c, i) {
      var known = Math.round((c.m + c.l) / c.n * 100);
      if (known) CTX.onProgress({ u: known, p: known, a: Math.round(c.m / c.n * 100) }, i + 1);
    });
  }
  function home() { if (CTX && CTX.go && CTX.go.hub) CTX.go.hub(); }
  function root(host, cls) {
    host.innerHTML = "";
    var r = el("div", "pw-root pw-page" + (cls ? " " + cls : ""));
    host.appendChild(r);
    return r;
  }
  function header(r, def, o) {
    o = o || {};
    var h = el("div", "in");
    h.appendChild(el("div", "pw-eyebrow", (o.back ? "" : "") + esc(o.eyebrow || def.title)));
    if (o.title) h.appendChild(el("h1", "pw-h1", esc(o.title)));
    if (o.lede) h.appendChild(el("p", "pw-lede", o.lede));
    r.appendChild(h);
    return h;
  }
  function backLink(r, label, fn) {
    var b = el("button", "pw-link", icon(I.back) + esc(label)); b.type = "button";
    b.addEventListener("click", fn);
    r.appendChild(b);
    return b;
  }
  function toast(msg) {
    var t = el("div", "pw-toast", esc(msg));
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function catOf(def, tid) { var t = def.idx[tid]; return def.cats.filter(function (c) { return c.id === t.cat; })[0]; }
  function chipFor(def, cid, t, o) {
    var st = P.status(cid, t.id), ready = !st && t.pre.every(function (p) { return P.known(cid, p); });
    var cat = catOf(def, t.id);
    var b = el("button", "pw-chip " + (st || (ready ? "r" : "")), (st === "m" ? icon(I.check) : "") + esc(t.name));
    b.type = "button"; b.style.setProperty("--h", cat.hue);
    b.title = st === "m" ? "Mastered" : st === "l" ? "Learned — a check will confirm it" : ready ? "Ready to learn" : "Not yet";
    b.addEventListener("click", function () { go("Learn/" + t.id); });
    return b;
  }
  function streakDays(r) {
    var n = 0, t = Date.now();
    if (!r.days[P.dayKey(t)]) t -= DAY;
    while (r.days[P.dayKey(t)] && (r.days[P.dayKey(t)].q || r.days[P.dayKey(t)].l)) { n++; t -= DAY; }
    return n;
  }
  function pickNext(def, cid, n) {
    var ready = P.ready(cid), out = [], seen = {};
    // one from each slice first, shallowest first, so "next up" is a spread
    ready.forEach(function (t) { if (out.length < n && !seen[t.cat]) { seen[t.cat] = 1; out.push(t); } });
    ready.forEach(function (t) { if (out.length < n && out.indexOf(t) < 0) out.push(t); });
    return out.slice(0, n);
  }

  /* ================================================================== Home */
  function renderHome(host, ctx) {
    CTX = ctx;
    var cid = ctx.course, def = P.get(cid), rec = P.rec(cid);
    var r = root(host, "pw-home");
    var counts = P.counts(cid), last = P.lastCheck(cid), first = !last && counts.m + counts.l === 0;
    var head = header(r, def, { eyebrow: def.title, title: first ? "Where do you stand?" : "Your ring",
      lede: first ? "Seventy topics, from adding integers to the quadratic formula. Find out which ones you already know — then learn only the ones you're ready for." :
        "Everything you know so far, and what to learn next." });

    var top = el("div", "pw-top");
    r.appendChild(top);

    /* the ring */
    var rc = el("div", "pw-card pw-ringcard in");
    var pctAll = Math.round((counts.m + counts.l) / counts.n * 100);
    rc.innerHTML = '<div class="pw-bigpct"><b>' + pctAll + '%</b><span>of ' + esc(def.title) + ' in your ring</span></div>' +
      '<div class="pw-legend"><span><i></i>Mastered · ' + counts.m + '</span><span><i class="l"></i>Learned · ' + counts.l + '</span><span><i class="n"></i>To go · ' + counts.todo + "</span></div>";
    var rw = el("div", "pw-ringwrap"); rc.appendChild(rw);
    top.appendChild(rc);
    var openCat = null;
    var from = rec.prefs && rec.prefs.seen;
    drawRing(rw, cid, { from: from, onSlice: function (id) { toggleCat(id, true); } });
    rec.prefs = rec.prefs || {}; rec.prefs.seen = seenNow(cid);
    P.save(); syncApp(cid);

    /* the right column */
    var side = el("div", "pw-side in");
    top.appendChild(side);
    if (first) {
      var hero = el("div", "pw-card pw-hero");
      hero.innerHTML = '<div class="pw-eyebrow">' + icon(I.target) + 'Placement Check</div><h2>Start with a short check.</h2>' +
        '<p>About 25 questions that get harder or easier as you answer. When it finishes, your ring shows what you already know, and the topics you\'re ready to learn are lit up.</p>' +
        '<ul><li>' + icon(I.check) + '<span>Nothing is marked as you go — it measures, it doesn\'t teach.</span></li>' +
        '<li>' + icon(I.check) + '<span><b>"I haven\'t learned this yet"</b> is always a fair answer. Use it instead of guessing — the check gets shorter and more accurate.</span></li>' +
        '<li>' + icon(I.check) + '<span>You can leave and come back; it picks up where you stopped.</span></li></ul>';
      var acts = el("div", "pw-acts");
      var go1 = el("button", "pw-btn primary lg", "Start the Placement Check" + icon(I.arrow)); go1.type = "button";
      go1.addEventListener("click", function () { go("Check"); });
      var go2 = el("button", "pw-btn ghost lg", icon(I.map) + "Or browse the map"); go2.type = "button";
      go2.addEventListener("click", function () { go("Graph"); });
      acts.appendChild(go1); acts.appendChild(go2); hero.appendChild(acts);
      side.appendChild(hero);
    } else {
      var nxt = pickNext(def, cid, 4);
      var nc = el("div", "pw-card");
      nc.appendChild(el("p", "pw-lbl", icon(I.play) + "Next up"));
      if (nxt.length) {
        var list = el("div", "pw-next");
        nxt.forEach(function (t) {
          var cat = catOf(def, t.id);
          var b = el("button", "pw-nx", '<span class="d"></span><span><b>' + esc(t.name) + '</b><small>' + esc(cat.name) + '</small></span>' + icon(I.arrow));
          b.type = "button"; b.style.setProperty("--h", cat.hue);
          b.addEventListener("click", function () { go("Learn/" + t.id); });
          list.appendChild(b);
        });
        nc.appendChild(list);
      } else {
        nc.appendChild(el("p", "pw-muted", counts.todo === 0 ? "You've learned every topic in the course. Keep your ring honest with a check." : "Nothing is ready right now — take a check to find what you can build on."));
      }
      side.appendChild(nc);

      var due = P.checkDue(cid), dueTopics = P.due(cid);
      var nb = el("div", "pw-card pw-notice");
      var msg = due === "topics" ? ["Time for a Knowledge Check", "You've learned " + plural(rec.since, "topic") + " since the last one. A check confirms what stuck."] :
        due === "time" ? ["Time for a Knowledge Check", "It's been a couple of weeks. A check confirms what you still know."] :
        ["Knowledge Check", "Confirms what you've learned and finds anything you've forgotten. Best after every ten new topics."];
      nb.innerHTML = icon(I.target) + "<div><b>" + msg[0] + "</b><p>" + msg[1] + "</p></div>";
      var cb = el("button", "pw-btn " + (due ? "primary" : ""), "Take a check"); cb.type = "button";
      cb.addEventListener("click", function () { go("Check"); });
      nb.appendChild(cb);
      side.appendChild(nb);

      if (dueTopics.length) {
        var rb = el("div", "pw-card pw-notice");
        rb.innerHTML = icon(I.refresh) + "<div><b>" + plural(dueTopics.length, "topic") + " to refresh</b><p>A quick question on each keeps them from fading.</p></div>";
        var rbb = el("button", "pw-btn", "Review"); rbb.type = "button";
        rbb.addEventListener("click", function () { go("Review"); });
        rb.appendChild(rbb);
        side.appendChild(rb);
      }

      var st = el("div", "pw-stats");
      var wk = 0; for (var k = 0; k < 7; k++) { var dd = rec.days[P.dayKey(Date.now() - k * DAY)]; if (dd) wk += dd.l || 0; }
      st.innerHTML = '<div class="pw-stat"><b>' + streakDays(rec) + '</b><span>day streak</span></div><div class="pw-stat"><b>' + wk + '</b><span>learned this week</span></div><div class="pw-stat"><b>' + P.ready(cid).length + '</b><span>ready to learn</span></div>';
      side.appendChild(st);
    }

    /* the slices */
    r.appendChild(el("h2", "pw-h2 in", "The whole course"));
    r.appendChild(el("p", "pw-sub", "Every topic, by slice. Anything can be opened whenever you like — the ones with a coloured outline are the ones you're ready for."));
    var cats = el("div", "pw-cats"); cats.style.display = "grid"; cats.style.gap = "12px";
    r.appendChild(cats);
    var byId = {};
    P.catCounts(cid).forEach(function (c) {
      var box = el("div", "pw-cat in");
      box.style.setProperty("--h", c.cat.hue);
      var pm = c.m / c.n * 100, pl = (c.m + c.l) / c.n * 100;
      var hd = el("button", "pw-cat-h", '<span class="d"></span><span><b>' + esc(c.cat.name) + '</b><small>' + esc(c.cat.blurb || "") + '</small></span><span class="pw-bar"><i class="l" style="width:' + pl + '%"></i><i style="width:' + pm + '%"></i></span><span class="ct">' + (c.m + c.l) + " / " + c.n + "</span>" + icon('<path d="m6 9 6 6 6-6"/>'));
      hd.type = "button";
      var body = el("div", "pw-cat-b"), chips = el("div", "pw-chips");
      c.cat.topics.slice().sort(function (a, b2) { return a.depth - b2.depth; }).forEach(function (t) { chips.appendChild(chipFor(def, cid, t)); });
      body.appendChild(chips);
      hd.addEventListener("click", function () { box.classList.toggle("open"); });
      box.appendChild(hd); box.appendChild(body); cats.appendChild(box);
      byId[c.cat.id] = box;
    });
    function toggleCat(id, scroll) {
      Object.keys(byId).forEach(function (k) { byId[k].classList.toggle("open", k === id ? true : byId[k].classList.contains("open") && false); });
      if (scroll && byId[id]) byId[id].scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
    }
    var foot = el("div", "pw-acts");
    var mb = el("button", "pw-btn", icon(I.map) + "See how it all fits together"); mb.type = "button";
    mb.addEventListener("click", function () { go("Graph"); });
    foot.appendChild(mb);
    r.appendChild(foot);
    r.appendChild(el("p", "pw-muted", "Your ring is private to you. It measures what you can do now — it isn't a grade, and nothing here is locked."));
    P.onSync(function () { if (host.isConnected && host.querySelector(".pw-home")) renderHome(host, ctx); });
    return r;
  }

  /* ================================================================== Learn */
  var LEARN = {};   // per topic, this visit: streak, misses, stage
  function renderLearn(host, ctx, tid) {
    CTX = ctx;
    var cid = ctx.course, def = P.get(cid), t = def.idx[tid];
    if (!t) return renderHome(host, ctx);
    var cat = catOf(def, tid), rec = P.rec(cid);
    var r = root(host, "pw-learn");
    r.style.setProperty("--h", cat.hue);
    var wrap = el("div", "pw-narrow"); r.appendChild(wrap);
    backLink(wrap, "Your ring", home);
    var st = P.status(cid, tid), ready = t.pre.every(function (p) { return P.known(cid, p); });
    var head = el("div", "in");
    head.innerHTML = '<div class="pw-top2"><span class="pw-eyebrow" style="color:' + cat.hue + '">' + esc(cat.name) + '</span><span class="pw-pill ' + (st || (ready ? "r" : "")) + '">' + (st === "m" ? "Mastered" : st === "l" ? "Learned" : ready ? "Ready to learn" : "Not yet") + '</span></div><h1 class="pw-h1" style="font-size:clamp(28px,3.6vw,38px)">' + esc(t.name) + "</h1>";
    wrap.appendChild(head);
    var unknownPre = t.pre.filter(function (p) { return !P.known(cid, p); });
    if (t.pre.length) {
      var pre = el("div", "pw-pre", "Builds on ");
      t.pre.forEach(function (p) { pre.appendChild(chipFor(def, cid, def.idx[p])); });
      wrap.appendChild(pre);
    }
    var S = LEARN[tid] || (LEARN[tid] = { streak: 0, miss: 0, n: 0, stage: st ? "practice" : "idea", ex: 0, hinted: false });
    var tabs = el("div", "pw-tabs"), stageHost = el("div", "pw-stage");
    var tIdea = el("button", null, "Idea"), tPr = el("button", null, "Practice");
    tIdea.type = tPr.type = "button";
    tabs.appendChild(tIdea); tabs.appendChild(tPr);
    wrap.appendChild(tabs); wrap.appendChild(stageHost);
    function setStage(s) { S.stage = s; tIdea.classList.toggle("on", s === "idea"); tPr.classList.toggle("on", s === "practice"); if (s === "idea") idea(); else practice(); }
    tIdea.addEventListener("click", function () { setStage("idea"); });
    tPr.addEventListener("click", function () { setStage("practice"); });

    function idea() {
      stageHost.innerHTML = "";
      var c1 = el("div", "pw-card in");
      c1.appendChild(el("p", "pw-lbl", icon(I.bulb) + "The idea"));
      c1.appendChild(el("p", "pw-idea", fmt(t.idea || "")));
      if (unknownPre.length && !st) {
        var nt = el("p", "pw-muted", "This builds on "); nt.style.marginTop = "12px";
        nt.innerHTML = "This builds on " + unknownPre.map(function (p) { return "<b>" + esc(def.idx[p].name) + "</b>"; }).join(" and ") + ", which " + (unknownPre.length > 1 ? "aren't" : "isn't") + " in your ring yet. Open " + (unknownPre.length > 1 ? "them" : "it") + " first if this feels hard — or carry on.";
        c1.appendChild(nt);
      }
      stageHost.appendChild(c1);
      var it = P.item(cid, tid, 1, "ex" + S.ex).item;
      var c2 = el("div", "pw-card in");
      c2.appendChild(el("p", "pw-lbl", icon(I.play) + "A worked example"));
      c2.appendChild(el("div", "pw-stem", fmt(it.q)));
      if (it.fig) c2.appendChild(el("div", "pw-fig", it.fig));
      var wv = walkView(it.walk, { stepwise: true });
      c2.appendChild(wv);
      var fin = el("div", "pw-verdict good pw-hide");
      fin.innerHTML = "<b>" + icon(I.check) + "So the answer is</b><p style=\"font-size:19px;color:var(--ink)\">" + ansHTML(it.a) + "</p>";
      c2.appendChild(fin);
      var acts = el("div", "pw-acts");
      var hidden = wv.querySelectorAll(".pw-hide");
      var nextB = el("button", "pw-btn", "Show the next step"); nextB.type = "button";
      var tryB = el("button", "pw-btn primary", "Try one yourself" + icon(I.arrow)); tryB.type = "button";
      var anoB = el("button", "pw-btn ghost", "Another example"); anoB.type = "button";
      nextB.addEventListener("click", function () {
        var h = wv.querySelector(".pw-hide");
        if (h) { h.classList.remove("pw-hide"); h.classList.add("in"); }
        if (!wv.querySelector(".pw-hide")) { nextB.style.display = "none"; fin.classList.remove("pw-hide"); }
      });
      if (!hidden.length) { nextB.style.display = "none"; fin.classList.remove("pw-hide"); }
      tryB.addEventListener("click", function () { setStage("practice"); });
      anoB.addEventListener("click", function () { S.ex++; idea(); });
      acts.appendChild(nextB); acts.appendChild(tryB); acts.appendChild(anoB);
      c2.appendChild(acts);
      stageHost.appendChild(c2);
    }

    var cur = null, t0 = 0, hinted = false;
    function practice() {
      stageHost.innerHTML = "";
      if (S.streak >= 3 && !S.done) { S.done = true; }
      var head2 = el("div", "pw-top2");
      head2.style.justifyContent = "space-between";
      var stepsRow = el("div", "pw-steps");
      stepsRow.setAttribute("aria-label", S.streak + " of 3 right in a row");
      for (var i = 0; i < 3; i++) stepsRow.appendChild(el("i", i < S.streak ? "on" : ""));
      head2.appendChild(el("span", "pw-muted", "Three right in a row and it's in your ring"));
      head2.appendChild(stepsRow);
      stageHost.appendChild(head2);
      var d = S.miss >= 2 ? 1 : [1, 2, 2][Math.min(S.streak, 2)];
      var made = P.item(cid, tid, d, "p" + Date.now().toString(36) + S.n++);
      var item = made.item;
      cur = questionView(item, {});
      stageHost.appendChild(cur.node);
      t0 = Date.now(); hinted = false;
      var fbHost = el("div"); cur.node.appendChild(fbHost);
      var acts = el("div", "pw-acts");
      var sub = el("button", "pw-btn primary", "Check answer"); sub.type = "button";
      var hintB = el("button", "pw-btn ghost", icon(I.bulb) + "Hint"); hintB.type = "button";
      var dk = el("button", "pw-btn ghost", "I don't know how"); dk.type = "button";
      acts.appendChild(sub); acts.appendChild(hintB); acts.appendChild(dk);
      cur.node.appendChild(acts);
      var answered = false;
      function submit() {
        if (answered) return;
        var v = cur.judge();
        if (v.empty) { if (cur.input) { cur.input.classList.remove("shake"); focusSoon(cur.input); } return; }
        if (v.bad) { fbHost.innerHTML = ""; fbHost.appendChild(el("div", "pw-verdict note", "<p>" + esc(v.bad) + "</p>")); return; }
        answered = true; cur.lock();
        var ok = !!v.ok;
        cur.reveal(ok);
        P.noteAnswer(cid, tid, d, ok, Date.now() - t0, hinted ? "hint" : "learn");
        fbHost.innerHTML = ""; hintB.style.display = "none"; dk.style.display = "none";
        if (ok && !hinted) {
          S.streak++; S.miss = Math.max(0, S.miss);
          fbHost.appendChild(el("div", "pw-verdict good", "<b>" + icon(I.check) + "Correct</b>"));
          var dots = stepsRow.querySelectorAll("i"); if (dots[S.streak - 1]) { dots[S.streak - 1].classList.add("on", "pop"); }
          if (S.streak >= 3) return setTimeout(finishTopic, reduced() ? 0 : 650);
        } else if (ok) {
          fbHost.appendChild(el("div", "pw-verdict note", "<b>" + icon(I.check) + "Correct — with a hint</b><p>That one doesn't count towards the three. One more without the hint.</p>"));
        } else {
          S.streak = 0; S.miss++;
          var say = v.why || knownMistake(item, cur.value()) || pointMistake(item, cur.value());
          var vd = el("div", "pw-verdict bad", "<b>" + icon(I.x) + "Not quite</b>" + (say ? "<p>" + fmt(say) + "</p>" : "") + "<p>The answer is <b style=\"color:var(--ink)\">" + ansHTML(item.a) + "</b>. Here's how to get it:</p>");
          fbHost.appendChild(vd);
          fbHost.appendChild(walkView(item.walk));
          if (S.miss >= 2 && unknownPre.length) {
            var stuck = el("div", "pw-verdict note", "<b>Feeling stuck?</b><p>This builds on " + esc(def.idx[unknownPre[0]].name) + ", which isn't in your ring yet.</p>");
            var sb = el("button", "pw-btn sm", "Open " + esc(def.idx[unknownPre[0]].name)); sb.type = "button";
            sb.addEventListener("click", function () { go("Learn/" + unknownPre[0]); });
            stuck.appendChild(sb); fbHost.appendChild(stuck);
          }
        }
        var more = el("div", "pw-acts");
        var nb = el("button", "pw-btn primary", (ok && !hinted ? "Next question" : "Try another") + icon(I.arrow)); nb.type = "button";
        nb.addEventListener("click", function () { practice(); });
        more.appendChild(nb);
        if (!ok) { var ib = el("button", "pw-btn ghost", "Read the idea again"); ib.type = "button"; ib.addEventListener("click", function () { setStage("idea"); }); more.appendChild(ib); }
        fbHost.appendChild(more);
        focusSoon(nb);
        acts.style.display = "none";
      }
      sub.addEventListener("click", submit);
      hintB.addEventListener("click", function () {
        if (hinted) return; hinted = true;
        var h = el("div", "pw-hint", icon(I.bulb) + "<span>" + fmt(item.hint || "Look at what is being asked, one step at a time.") + "</span>");
        fbHost.innerHTML = ""; fbHost.appendChild(h);
      });
      dk.addEventListener("click", function () {
        if (answered) return; answered = true; cur.lock();
        P.noteAnswer(cid, tid, d, false, Date.now() - t0, "skip");
        S.streak = 0; S.miss++;
        fbHost.innerHTML = ""; acts.style.display = "none";
        fbHost.appendChild(el("div", "pw-verdict note", "<b>That's fine — let's see how it works</b><p>The answer is <b style=\"color:var(--ink)\">" + ansHTML(item.a) + "</b>.</p>"));
        fbHost.appendChild(walkView(item.walk));
        var more = el("div", "pw-acts");
        var nb = el("button", "pw-btn primary", "Try another" + icon(I.arrow)); nb.type = "button"; nb.addEventListener("click", practice);
        var ib = el("button", "pw-btn ghost", "Read the idea again"); ib.type = "button"; ib.addEventListener("click", function () { setStage("idea"); });
        more.appendChild(nb); more.appendChild(ib); fbHost.appendChild(more); focusSoon(nb);
      });
      cur.node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey && !answered) { e.preventDefault(); submit(); }
        else if (!answered && cur.key(e)) { /* a choice picked by number */ }
      });
      cur.focus();
    }

    function finishTopic() {
      var before = P.counts(cid), res = P.learned(cid, tid);
      syncApp(cid);
      var pill = head.querySelector(".pw-pill"); if (pill) { pill.className = "pw-pill " + (P.status(cid, tid) || ""); pill.textContent = P.status(cid, tid) === "m" ? "Mastered" : "Learned"; }
      var readyBefore = {}; // topics that became ready because of this one
      var newly = t.post.map(function (k) { return def.idx[k]; }).filter(function (x) { return !P.known(cid, x.id) && x.pre.every(function (p) { return P.known(cid, p); }); });
      stageHost.innerHTML = "";
      var done = el("div", "pw-card in");
      done.innerHTML = '<p class="pw-lbl" style="color:var(--pw-good)">' + icon(I.check) + (res.gain ? "Learned" : "Nice work") + "</p><h2 class=\"pw-h2\" style=\"margin-top:0\">" + esc(t.name) + (res.gain ? " is in your ring." : " — still strong.") + "</h2>" +
        "<p class=\"pw-sub\">" + (res.gain ? "It's marked <b>learned</b>. A Knowledge Check will confirm it and turn it to <b>mastered</b>." : "It was already " + (res.was === "m" ? "mastered" : "learned") + ".") + "</p>";
      var nx = pickNext(def, cid, 3);
      if (newly.length || nx.length) {
        done.appendChild(el("p", "pw-lbl", "")).style.marginTop = "18px";
        done.lastChild.innerHTML = icon(I.play) + "Next up";
        var list = el("div", "pw-next");
        var shown = newly.concat(nx.filter(function (x) { return newly.indexOf(x) < 0; })).slice(0, 4);
        shown.forEach(function (x) {
          var cx = catOf(def, x.id), isNew = newly.indexOf(x) > -1;
          var b = el("button", "pw-nx" + (isNew ? " now" : ""), '<span class="d"></span><span><b>' + esc(x.name) + (isNew ? '<span class="pw-nowtag">Now ready</span>' : "") + "</b><small>" + esc(cx.name) + "</small></span>" + icon(I.arrow));
          b.type = "button"; b.style.setProperty("--h", cx.hue);
          b.addEventListener("click", function () { go("Learn/" + x.id); });
          list.appendChild(b);
        });
        done.appendChild(list);
      }
      var acts = el("div", "pw-acts");
      var rb = el("button", "pw-btn primary", "Back to your ring"); rb.type = "button"; rb.addEventListener("click", home);
      acts.appendChild(rb);
      var due = P.checkDue(cid);
      if (due === "topics") {
        var cb = el("button", "pw-btn", icon(I.target) + "Take a Knowledge Check"); cb.type = "button"; cb.addEventListener("click", function () { go("Check"); });
        acts.appendChild(cb);
        done.appendChild(el("p", "pw-muted", "You've learned " + plural(P.rec(cid).since, "new topic") + " since your last check — a good moment to confirm them.")).style.marginTop = "14px";
      }
      done.appendChild(acts);
      stageHost.appendChild(done);
      LEARN[tid] = null;
      toTop();
    }
    setStage(S.stage);
    return r;
  }

  /* ================================================================== Check */
  function chkKey(ctx) { return "oplo.path.chk." + (ctx.me ? ctx.me.id : "anon") + "." + ctx.course; }
  function readChk(ctx) { try { return JSON.parse(localStorage.getItem(chkKey(ctx)) || "null"); } catch (e) { return null; } }
  function writeChk(ctx, v) { try { if (v) localStorage.setItem(chkKey(ctx), JSON.stringify(v)); else localStorage.removeItem(chkKey(ctx)); } catch (e) { /* blocked */ } }

  function renderCheck(host, ctx) {
    CTX = ctx;
    var cid = ctx.course, def = P.get(cid), rec = P.rec(cid);
    var first = !rec.chk.length;
    var r = root(host, "pw-check");
    var wrap = el("div", "pw-narrow"); r.appendChild(wrap);
    var saved = readChk(ctx);
    if (saved && saved.cid === cid && saved.ans && saved.ans.length) return runCheck(wrap, ctx, saved);
    backLink(wrap, "Your ring", home);
    var c = el("div", "pw-card pw-hero in");
    c.innerHTML = '<div class="pw-eyebrow">' + icon(I.target) + (first ? "Placement Check" : "Knowledge Check") + "</div>" +
      "<h2>" + (first ? "Let's find out what you already know." : "Let's see what has stuck.") + "</h2>" +
      "<p>" + (first ? "You'll be asked about " + "25 to 28" + " topics, in an order that adapts to your answers. Most people take 25 to 35 minutes." :
        "About 20 questions across the whole course. Learned topics get confirmed; anything you've forgotten goes back to be learned again.") + "</p>" +
      "<ul><li>" + icon(I.check) + "<span>Nothing is marked while you work. You'll see everything at the end.</span></li>" +
      "<li>" + icon(I.check) + "<span>If you haven't learned something, choose <b>“I haven't learned this yet”</b> — don't guess. It makes the check shorter and the result truer.</span></li>" +
      "<li>" + icon(I.check) + "<span>Type answers the way you'd write them: <b>3/4</b>, <b>-2</b>, <b>(2, -3)</b>, <b>3x + 2</b>. You don't need to simplify unless asked.</span></li></ul>";
    var acts = el("div", "pw-acts");
    var go1 = el("button", "pw-btn primary lg", "Begin" + icon(I.arrow)); go1.type = "button";
    go1.addEventListener("click", function () { runCheck(wrap, ctx, null); });
    acts.appendChild(go1); c.appendChild(acts);
    wrap.appendChild(c);
    return r;
  }

  function runCheck(wrap, ctx, saved) {
    var cid = ctx.course, def = P.get(cid), rec = P.rec(cid);
    var A = P.assess(cid, saved ? { seed: saved.seed, kind: saved.kind } : {});
    var log = { cid: cid, seed: A.seed, kind: A.kind, ans: [] };
    // resuming: replay the answers on the same seed — the questions come back exactly
    if (saved) {
      for (var i = 0; i < saved.ans.length; i++) {
        var q0 = A.next();
        if (!q0 || q0.topic.id !== saved.ans[i].t) { writeChk(ctx, null); log.ans = []; A = P.assess(cid, {}); log.seed = A.seed; log.kind = A.kind; break; }
        A.answer(saved.ans[i].r === 1 ? true : saved.ans[i].r === 2 ? null : false);
        log.ans.push(saved.ans[i]);
      }
    }
    var inner = el("div");
    wrap.innerHTML = ""; wrap.appendChild(inner);
    function step() {
      var q = A.next();
      if (!q) return finish();
      inner.innerHTML = "";
      var top = el("div", "pw-chk-head");
      var ex = el("button", "pw-link", icon(I.back) + "Save and exit"); ex.type = "button";
      ex.addEventListener("click", home);
      var pg = el("div", "pw-prog", "<i></i>"), nn = el("span", "pw-chk-n", "Question " + q.n + " of about " + Math.round(A.max * (A.first ? 0.92 : 1)));
      top.appendChild(ex); top.appendChild(pg); top.appendChild(nn);
      inner.appendChild(top);
      requestAnimationFrame(function () { var b = pg.firstChild; if (b) b.style.width = Math.round(((q.n - 1) / A.max) * 100) + "%"; });
      var qv = questionView(q.item, {});
      inner.appendChild(qv.node);
      var msg = el("div"); qv.node.appendChild(msg);
      var dk = el("div", "pw-dk");
      var sub = el("button", "pw-btn primary", "Submit" + icon(I.arrow)); sub.type = "button";
      var dont = el("button", "pw-btn ghost", "I haven't learned this yet"); dont.type = "button";
      dk.appendChild(dont); dk.appendChild(sub);
      qv.node.appendChild(dk);
      var busy = false;
      function record(res) {
        if (busy) return; busy = true;
        var rr = res === true ? 1 : res === null ? 2 : 0;
        A.answer(res);
        log.ans.push({ t: q.topic.id, r: rr });
        writeChk(ctx, log);
        step();
        toTop();
      }
      sub.addEventListener("click", function () {
        var v = qv.judge();
        if (v.empty) { focusSoon(qv.input || null); return; }
        if (v.bad) { msg.innerHTML = ""; msg.appendChild(el("div", "pw-verdict note", "<p>" + esc(v.bad) + "</p>")); return; }
        record(!!v.ok);
      });
      dont.addEventListener("click", function () { record(null); });
      qv.node.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sub.click(); } else qv.key(e); });
      qv.focus();
    }
    function finish() {
      inner.innerHTML = '<div class="pw-loading">Working out your ring…</div>';
      var before = seenNow(cid), prevCounts = P.counts(cid);
      setTimeout(function () {
        var res = A.finish();
        writeChk(ctx, null);
        results(inner, ctx, res, before, prevCounts);
        toTop();
      }, 350);
    }
    step();
  }

  function results(inner, ctx, res, from, prev) {
    var cid = ctx.course, def = P.get(cid), counts = res.counts, rec = P.rec(cid);
    inner.innerHTML = "";
    if (inner.parentNode) inner.parentNode.classList.remove("pw-narrow");   // the result is wider than a question
    var head = el("div", "in");
    head.innerHTML = '<div class="pw-eyebrow">' + icon(I.check) + (res.first ? "Placement Check complete" : "Knowledge Check complete") + "</div><h1 class=\"pw-h1\">" +
      (res.first ? (counts.m ? "You already know " + counts.m + " of " + counts.n + " topics." : "You're starting fresh — that's a fine place to be.") :
        (res.confirmed.length || res.gained.length ? "Confirmed. " + (res.confirmed.length + res.gained.length) + " topics are now mastered." : "That's your ring, checked.")) + "</h1>";
    inner.appendChild(head);
    var grid = el("div", "pw-res"); inner.appendChild(grid);
    var rc = el("div", "pw-card pw-ringcard in");
    rc.innerHTML = '<div class="pw-legend"><span><i></i>Mastered · ' + counts.m + '</span><span><i class="l"></i>Learned · ' + counts.l + '</span><span><i class="n"></i>To go · ' + counts.todo + "</span></div>";
    var rw = el("div", "pw-ringwrap"); rc.appendChild(rw);
    grid.appendChild(rc);
    drawRing(rw, cid, { from: res.first ? null : from });
    rec.prefs = rec.prefs || {}; rec.prefs.seen = seenNow(cid);
    P.save(); syncApp(cid);
    var side = el("div", "pw-side in");
    grid.appendChild(side);
    var delta = el("div", "pw-delta");
    var bits = [];
    if (res.first) bits.push(["" + counts.m, "topics you already know"]);
    else {
      bits.push(["+" + (res.gained.length + res.confirmed.length), "mastered"]);
      if (res.back.length) bits.push(["−" + res.back.length, "to learn again"]);
    }
    bits.push(["" + P.ready(cid).length, "ready to learn"]);
    bits.forEach(function (b) { var s = el("div", "pw-stat"); s.innerHTML = "<b>" + b[0] + "</b><span>" + b[1] + "</span>"; delta.appendChild(s); });
    side.appendChild(delta);
    if (res.back.length) {
      var bc = el("div", "pw-card");
      bc.appendChild(el("p", "pw-lbl", icon(I.refresh) + "Back to learn"));
      bc.appendChild(el("p", "pw-muted", "These had faded. They're not lost — the second time goes faster."));
      var ul = el("ul", "pw-list"); ul.style.marginTop = "10px";
      res.back.slice(0, 6).forEach(function (id) { var t = def.idx[id], cat = catOf(def, id), li = el("li", null, "<i></i>" + esc(t.name)); li.firstChild.style.setProperty("--h", cat.hue); ul.appendChild(li); });
      bc.appendChild(ul); side.appendChild(bc);
    }
    var nx = pickNext(def, cid, 4), nc = el("div", "pw-card");
    nc.appendChild(el("p", "pw-lbl", icon(I.play) + "Where to next"));
    if (nx.length) {
      var list = el("div", "pw-next");
      nx.forEach(function (t) {
        var cat = catOf(def, t.id);
        var b = el("button", "pw-nx", '<span class="d"></span><span><b>' + esc(t.name) + '</b><small>' + esc(cat.name) + "</small></span>" + icon(I.arrow));
        b.type = "button"; b.style.setProperty("--h", cat.hue);
        b.addEventListener("click", function () { go("Learn/" + t.id); });
        list.appendChild(b);
      });
      nc.appendChild(list);
    } else nc.appendChild(el("p", "pw-muted", "Nothing is ready to learn right now — the whole course is in your ring."));
    side.appendChild(nc);
    var acts = el("div", "pw-acts");
    var hb = el("button", "pw-btn primary lg", "Go to your ring" + icon(I.arrow)); hb.type = "button"; hb.addEventListener("click", home);
    var mb = el("button", "pw-btn ghost lg", icon(I.map) + "See the map"); mb.type = "button"; mb.addEventListener("click", function () { go("Graph"); });
    acts.appendChild(hb); acts.appendChild(mb);
    inner.appendChild(acts);
  }

  /* ================================================================ Review */
  function renderReview(host, ctx) {
    CTX = ctx;
    var cid = ctx.course, def = P.get(cid);
    var r = root(host, "pw-review");
    var wrap = el("div", "pw-narrow"); r.appendChild(wrap);
    backLink(wrap, "Your ring", home);
    var due = P.due(cid).sort(function (a, b) { return (P.rec(cid).t[a.id].at || 0) - (P.rec(cid).t[b.id].at || 0); }).slice(0, 6);
    if (!due.length) {
      var c0 = el("div", "pw-card in");
      c0.innerHTML = '<p class="pw-lbl">' + icon(I.check) + "Nothing to refresh</p><h2 class=\"pw-h2\" style=\"margin-top:0\">Everything is fresh.</h2><p class=\"pw-sub\">Topics come back here as they're due, a few days after you learn them.</p>";
      wrap.appendChild(c0); return r;
    }
    var i = 0, right = 0, dropped = [];
    var inner = el("div"); wrap.appendChild(inner);
    function one(retry) {
      if (i >= due.length) return summary();
      var t = due[i], cat = catOf(def, t.id);
      inner.innerHTML = "";
      var top = el("div", "pw-chk-head");
      var pg = el("div", "pw-prog", "<i></i>"), nn = el("span", "pw-chk-n", (i + 1) + " of " + due.length);
      top.appendChild(pg); top.appendChild(nn); inner.appendChild(top);
      requestAnimationFrame(function () { var b = pg.firstChild; if (b) b.style.width = Math.round(i / due.length * 100) + "%"; });
      var lab = el("p", "pw-eyebrow", '<span style="color:' + cat.hue + '">' + esc(t.name) + "</span>" + (retry ? " · one more, a little easier" : "")); lab.style.margin = "12px 0 8px";
      inner.appendChild(lab);
      var made = P.item(cid, t.id, retry ? 1 : 2), item = made.item, qv = questionView(item, {});
      inner.appendChild(qv.node);
      var msg = el("div"); qv.node.appendChild(msg);
      var acts = el("div", "pw-acts");
      var sub = el("button", "pw-btn primary", "Check answer"); sub.type = "button";
      acts.appendChild(sub); qv.node.appendChild(acts);
      var answered = false, t0 = Date.now();
      function submit() {
        if (answered) return;
        var v = qv.judge();
        if (v.empty) return; if (v.bad) { msg.innerHTML = ""; msg.appendChild(el("div", "pw-verdict note", "<p>" + esc(v.bad) + "</p>")); return; }
        answered = true; qv.lock(); qv.reveal(!!v.ok); acts.style.display = "none";
        P.noteAnswer(cid, t.id, retry ? 1 : 2, !!v.ok, Date.now() - t0, "review");
        msg.innerHTML = "";
        var nb = el("button", "pw-btn primary", "Continue" + icon(I.arrow)); nb.type = "button";
        var more = el("div", "pw-acts"); more.appendChild(nb);
        if (v.ok) {
          P.reviewed(cid, t.id, true); right++; syncApp(cid);
          msg.appendChild(el("div", "pw-verdict good", "<b>" + icon(I.check) + "Still solid</b>"));
          nb.addEventListener("click", function () { i++; one(false); });
        } else {
          var say = v.why || knownMistake(item, qv.value());
          msg.appendChild(el("div", "pw-verdict bad", "<b>" + icon(I.x) + "Not quite</b>" + (say ? "<p>" + fmt(say) + "</p>" : "") + "<p>The answer is <b style=\"color:var(--ink)\">" + ansHTML(item.a) + "</b>.</p>"));
          msg.appendChild(walkView(item.walk));
          if (retry) { P.slipped(cid, t.id); dropped.push(t); nb.addEventListener("click", function () { i++; one(false); }); }
          else nb.addEventListener("click", function () { one(true); });
        }
        msg.appendChild(more); focusSoon(nb);
      }
      sub.addEventListener("click", submit);
      qv.node.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } else qv.key(e); });
      qv.focus();
    }
    function summary() {
      inner.innerHTML = "";
      var c = el("div", "pw-card in");
      c.innerHTML = '<p class="pw-lbl">' + icon(I.check) + "Review done</p><h2 class=\"pw-h2\" style=\"margin-top:0\">" + right + " of " + due.length + " still solid.</h2>" +
        (dropped.length ? "<p class=\"pw-sub\">" + plural(dropped.length, "topic") + " " + (dropped.length > 1 ? "have" : "has") + " gone back to learn: " + dropped.map(function (t) { return esc(t.name); }).join(", ") + ".</p>" : "<p class=\"pw-sub\">They're fresh for a while longer.</p>");
      var acts = el("div", "pw-acts");
      var hb = el("button", "pw-btn primary", "Back to your ring"); hb.type = "button"; hb.addEventListener("click", home);
      acts.appendChild(hb); c.appendChild(acts); inner.appendChild(c);
    }
    one(false);
    return r;
  }

  /* =================================================================== Map */
  function renderMap(host, ctx) {
    CTX = ctx;
    var cid = ctx.course, def = P.get(cid);
    var r = root(host, "pw-mapp");
    backLink(r, "Your ring", home);
    header(r, def, { eyebrow: def.title, title: "How it all fits together", lede: "Every topic, and what it rests on. Filled means mastered, tinted means learned, outlined means you're ready for it. Nothing is locked — click any topic." });
    var key = el("div", "pw-map-key", '<span><i></i>Mastered</span><span><i class="l"></i>Learned</span><span><i class="r"></i>Ready</span><span><i class="n"></i>Not yet</span>');
    r.appendChild(key);
    var box = el("div", "pw-map in"), inner = el("div", "pw-map-in"); box.appendChild(inner); r.appendChild(box);
    var CW = 206, NW = 184, NH = 32, GAPY = 8, LANE_PAD = 28, LANE_GAP = 10, X0 = 14;
    var maxD = def.byDepth[def.byDepth.length - 1].depth;
    // lanes: one per slice; within a lane, stack topics that share a column
    var pos = {}, y = 0, lanes = [];
    def.cats.forEach(function (c) {
      var col = {}, maxStack = 1;
      c.topics.slice().sort(function (a, b) { return a.depth - b.depth; }).forEach(function (t) {
        col[t.depth] = (col[t.depth] || 0) + 1; maxStack = Math.max(maxStack, col[t.depth]);
      });
      var used = {};
      var lane = { c: c, y: y, h: LANE_PAD + maxStack * (NH + GAPY) };
      c.topics.slice().sort(function (a, b) { return a.depth - b.depth; }).forEach(function (t) {
        var k = used[t.depth] = (used[t.depth] || 0);
        used[t.depth]++;
        pos[t.id] = { x: X0 + t.depth * CW, y: y + LANE_PAD + k * (NH + GAPY) };
      });
      lanes.push(lane);
      y += lane.h + LANE_GAP;
    });
    var W = X0 + (maxD + 1) * CW + 12, Hh = y;
    inner.style.width = W + "px"; inner.style.height = Hh + "px";
    lanes.forEach(function (l) {
      var d = el("div", "pw-lane"); d.style.top = l.y + "px"; d.style.height = l.h + "px"; d.style.setProperty("--h", l.c.hue);
      inner.appendChild(d);
      var lb = el("div", "pw-lane-l", esc(l.c.name)); lb.style.top = (l.y + 7) + "px"; lb.style.setProperty("--h", l.c.hue);
      inner.appendChild(lb);
    });
    var svg = svgEl("svg", { width: W, height: Hh, viewBox: "0 0 " + W + " " + Hh });
    inner.appendChild(svg);
    var edges = [];
    def.topics.forEach(function (t) {
      t.pre.forEach(function (p) {
        var a = pos[p], b = pos[t.id], x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, mx = (x1 + x2) / 2;
        var path = svgEl("path", { d: "M" + x1 + " " + y1 + "C" + mx + " " + y1 + " " + mx + " " + y2 + " " + x2 + " " + y2 });
        svg.appendChild(path); edges.push({ el: path, from: p, to: t.id });
      });
    });
    var nodes = {};
    def.topics.forEach(function (t) {
      var st = P.status(cid, t.id), ready = !st && t.pre.every(function (p) { return P.known(cid, p); });
      var cat = catOf(def, t.id);
      var n = el("button", "pw-node " + (st || (ready ? "r" : "")), "<span>" + esc(t.name) + "</span>");
      n.type = "button"; n.style.left = pos[t.id].x + "px"; n.style.top = pos[t.id].y + "px"; n.style.width = NW + "px"; n.style.setProperty("--h", cat.hue);
      n.title = t.name;
      n.addEventListener("click", function () { go("Learn/" + t.id); });
      function lit() {
        box.classList.add("hov");
        var on = {}; on[t.id] = 1; t.anc.forEach(function (k) { on[k] = 1; }); t.desc.forEach(function (k) { on[k] = 1; });
        Object.keys(nodes).forEach(function (k) { nodes[k].classList.toggle("hot", !!on[k]); });
        edges.forEach(function (e) { e.el.classList.toggle("hot", !!on[e.from] && !!on[e.to] && (e.from === t.id || e.to === t.id || (t.anc.indexOf(e.to) > -1 || e.to === t.id) && (t.anc.indexOf(e.from) > -1) || (t.desc.indexOf(e.from) > -1 || e.from === t.id) && (t.desc.indexOf(e.to) > -1))); });
      }
      function dim() { box.classList.remove("hov"); Object.keys(nodes).forEach(function (k) { nodes[k].classList.remove("hot"); }); edges.forEach(function (e) { e.el.classList.remove("hot"); }); }
      n.addEventListener("mouseenter", lit); n.addEventListener("focus", lit); n.addEventListener("mouseleave", dim); n.addEventListener("blur", dim);
      inner.appendChild(n); nodes[t.id] = n;
    });
    return r;
  }

  /* ================================================================= Hub */
  LAB.addHub("alp", function (host, ctx, what) {
    P.useAccount(ctx.me);
    var parts = (what || "").split("/"), a = parts[0], b = parts.slice(1).join("/");
    try {
      if (!P.get(ctx.course)) throw new Error("This course's topics didn't load.");
      if (a === "Learn") return renderLearn(host, ctx, b);
      if (a === "Check") return renderCheck(host, ctx);
      if (a === "Review") return renderReview(host, ctx);
      if (a === "Graph") return renderMap(host, ctx);
      return renderHome(host, ctx);
    } catch (e) {
      if (window.console) console.error(e);
      host.innerHTML = "";
      host.appendChild(el("div", "lb-none", "<b>Algebra Pathway couldn't open.</b><p>" + esc(e && e.message || "Something went wrong.") + "</p>"));
    }
  });

  P.ui = { renderHome: renderHome, drawRing: drawRing, questionView: questionView };
})();
