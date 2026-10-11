/* ==========================================================================
   Grade 1 Math on Kern — the engine. See lab/k1art.js (pictures),
   lab/k1geom.js (where things are), lab/k1kinds.js (the steps).

   A six-year-old cannot read a paragraph, cannot type, and learns a word
   like "under" by putting something under something. So this course is
   built from five things:

     Voice     every prompt is read aloud (the browser's own speech), with a
               Listen button and one switch that is remembered.
     Sound     little sounds made in the browser: a tick, a soft landing, a
               bell that climbs as things are counted, three notes for "yes".
               One more switch, also remembered. Never a buzzer.
     Scenes    a picture whose parts can be dragged — or tapped, then tapped
               where they should go, or moved with the arrow keys — and that
               knows what is true of what, the moment it is let go: "Moti is
               ON the table." It says so whether that is the answer or not.
     Graph     the same picture as named nodes ("moti", "table") with a
               sentence each, in the attributes a screen reader reads. Hints,
               the glow after a quiet moment, and one day a tutor, all point
               at the picture through Scene.act, which takes only names that
               are in the graph. Shaped on how Brilliant does it; see
               docs/BRILLIANT_ACTIVITY_ARCHITECTURE.md.
     Steps     choose, put, tap, count, sort, paint: lab/k1kinds.js.

   Nothing here is specific to one lesson.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, CH = window.OPLO_CHALLENGE, A = window.OPLO_K1ART, G = window.OPLO_K1GEOM;
  if (!LAB || !CH || !A || !G) return;
  if (window.OPLO_K1) return;
  var el = LAB.el, esc = LAB.esc, button = LAB.button;
  var NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function reduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function later(fn, ms) { return setTimeout(fn, reduced() ? Math.min(ms, 60) : ms); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ================================================================ Voice
     The browser reads it. A voice for India first, then British, then any
     English one; a little slower than adults talk, a little brighter. */
  var VOICE = (function () {
    var ss = window.speechSynthesis, can = !!(ss && window.SpeechSynthesisUtterance), voice = null, last = "", lastAt = 0;
    function readPref() { try { return localStorage.getItem("oplo.k1.voice") !== "off"; } catch (e) { return true; } }
    var on = readPref(), subs = [];
    function choose() {
      if (!can) return;
      var vs = ss.getVoices() || [];
      var order = [/en[-_]IN/i, /en[-_]GB/i, /en[-_]AU/i, /en[-_]US/i, /^en/i];
      for (var i = 0; i < order.length && !voice; i++) {
        var hit = vs.filter(function (v) { return order[i].test(v.lang); });
        // A female voice first, if the list says which: children's books are read that way here.
        voice = hit.filter(function (v) { return /veena|samantha|karen|moira|tessa|serena|kate|female/i.test(v.name); })[0] || hit[0] || null;
      }
    }
    if (can) { choose(); if (ss.addEventListener) ss.addEventListener("voiceschanged", choose); }
    function say(text, o) {
      o = o || {};
      text = G.plain(text);
      if (!can || !text) return false;
      if (!on && !o.force) return false;
      var now = Date.now();
      if (!o.queue && text === last && now - lastAt < 700) return false;       // the same words twice in a breath
      last = text; lastAt = now;
      try {
        if (!o.queue) ss.cancel();
        var u = new window.SpeechSynthesisUtterance(text);
        if (!voice) choose();
        if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = "en-IN";
        u.rate = o.rate || 0.86; u.pitch = 1.08; u.volume = 1;
        if (o.done) u.onend = o.done;
        ss.speak(u);
        return true;
      } catch (e) { return false; }
    }
    return {
      can: can, say: say,
      stop: function () { if (can) try { ss.cancel(); } catch (e) { /* no voice */ } },
      speaking: function () { return can && !!ss.speaking; },
      isOn: function () { return on; },
      set: function (v) { on = !!v; try { if (on) localStorage.removeItem("oplo.k1.voice"); else localStorage.setItem("oplo.k1.voice", "off"); } catch (e) { /* private window */ } if (!on) this.stop(); subs.forEach(function (f) { f(on); }); },
      sub: function (f) { subs.push(f); }
    };
  })();

  /* ================================================================ Sound
     Little sounds, made in the browser (no files to load): a tick when a thing
     is picked up, a soft landing when it is put down, a bell that rises with
     each thing counted, three notes for "yes", two gentle falling ones for
     "look again" — never a buzzer. Quiet on purpose, and one switch that is
     remembered. They sit under the reading voice, which is never covered. */
  var SFX = (function () {
    var AC = window.AudioContext || window.webkitAudioContext, ctx = null, master = null, subs = [];
    function readPref() { try { return localStorage.getItem("oplo.k1.sfx") !== "off"; } catch (e) { return true; } }
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
      set: function (v) { on = !!v; try { if (on) localStorage.removeItem("oplo.k1.sfx"); else localStorage.setItem("oplo.k1.sfx", "off"); } catch (e) { /* private window */ } subs.forEach(function (f) { f(on); }); },
      sub: function (f) { subs.push(f); },
      // Browsers start sound only after a touch or a key: wake it on the first one.
      unlock: ready
    };
  })();
  if (SFX.can) ["pointerdown", "keydown"].forEach(function (ev) { window.addEventListener(ev, function once() { window.removeEventListener(ev, once, true); SFX.unlock(); }, true); });

  /* ================================================================ Scene
     spec: { w, h, bg: "room" | "garden" | "plain" | "track", alt,
             things: [ { id, art, args, role, label, s,
                         x | cx, y | bottom ("ground" or a number) } ] }
     role:  "ref"   stays where it is and has zones other things are measured by
            "move"  can be dragged (or tapped, then tapped where it goes)
            "tap"   can be tapped
            "deco"  just there                                                */
  function Scene(spec, o) {
    o = o || {};
    var W = spec.w || 640, H = spec.h || 360;
    var bg = A.BG[spec.bg || "plain"](W, H);
    var S = { W: W, H: H, ground: spec.ground != null ? spec.ground : bg.ground, groundLabel: bg.groundLabel, T: {}, list: [], ev: {}, locked: false, sel: null, moved: {}, spec: spec, gravity: !!(o.gravity || spec.gravity) };
    var svg = S.svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "k1-svg", role: "group", "aria-label": spec.alt || "A picture." });
    var L = S.L = {};
    ["bg", "back", "shadow", "mid", "front", "top", "hit", "over"].forEach(function (k) { L[k] = svgEl("g", { class: "k1-l-" + k }, svg); });
    L.bg.innerHTML = bg.svg + (spec.deco || "");
    L.over.setAttribute("pointer-events", "none");

    S.on = function (ev, fn) { (S.ev[ev] = S.ev[ev] || []).push(fn); return S; };
    S.emit = function (ev, a, b, c) { (S.ev[ev] || []).forEach(function (f) { f(a, b, c); }); };

    function xf(T) { return "translate(" + T.g.x.toFixed(2) + "px," + T.g.y.toFixed(2) + "px) scale(" + T.s + ")"; }
    function paint(T) {
      T.node.style.transform = xf(T); if (T.fnode) T.fnode.style.transform = xf(T);
      if (T.box && T.role === "move") { T.box.setAttribute("x", (T.g.x - 8).toFixed(1)); T.box.setAttribute("y", (T.g.y - 8).toFixed(1)); }
    }

    /* ---- adding things */
    S.add = function (ts) {
      var sp = A.ART[ts.art](ts.args || {}), s = ts.s || 1, w = sp.w * s, h = sp.h * s;
      var x = ts.x != null ? ts.x : (ts.cx != null ? ts.cx - w / 2 : 0);
      var y = ts.y != null ? ts.y : ((ts.bottom === "ground" || ts.bottom == null ? S.ground : ts.bottom) - h);
      var T = { id: ts.id || ("t" + S.list.length), role: ts.role || "ref", sp: sp, s: s, art: ts.art, args: ts.args || {}, attrs: ts.attrs || {}, spec: ts,
                label: ts.label || sp.label || ts.art, g: G.place(sp, x, y, s), flip: !!ts.flip, rest: null };
      T.home = { x: T.g.x, y: T.g.y };
      var movable = T.role === "move";
      var node = T.node = svgEl("g", { class: "k1-th k1-" + T.art + " k1-role-" + T.role, "data-id": T.id });
      node.innerHTML = '<g class="k1-in">' + (T.flip ? '<g transform="translate(' + sp.w + ' 0) scale(-1 1)">' + sp.back + "</g>" : sp.back) + "</g>";

      if (sp.front) { T.fnode = svgEl("g", { class: "k1-th-f" }); T.fnode.innerHTML = sp.front; L.front.appendChild(T.fnode); }
      paint(T);
      if (movable) {
        // What is grabbed is a clear box over everything, so a thing half behind a basket's wall can still be picked up.
        T.box = svgEl("rect", { class: "k1-hitbox k1-role-move", "data-id": T.id, x: T.g.x - 8, y: T.g.y - 8, width: T.g.w + 16, height: T.g.h + 16, rx: 12, fill: "#fff", "fill-opacity": 0, "pointer-events": "all" }, L.hit);
        T.shadow = svgEl("ellipse", { class: "k1-shadow", rx: 1, ry: 1, cx: 0, cy: 0, opacity: 0 }, L.shadow);
        L.top.appendChild(node);
        node.setAttribute("tabindex", "0"); node.setAttribute("role", "button");
        wireMover(T);
      } else {
        L.back.appendChild(node);
        if (T.role === "tap") {
          node.setAttribute("tabindex", "0"); node.setAttribute("role", "button"); node.setAttribute("aria-pressed", "false"); node.setAttribute("aria-label", T.label);
          // What is tapped is a clear box over everything, so a thing behind a car window or a basket's wall can still be tapped.
          T.box = svgEl("rect", { class: "k1-hitbox k1-role-tap", "data-id": T.id, x: T.g.x - 4, y: T.g.y - 4, width: T.g.w + 8, height: T.g.h + 8, rx: 10, fill: "#fff", "fill-opacity": 0, "pointer-events": "all" }, L.hit);
          T.box.addEventListener("pointerenter", function () { node.classList.add("k1-hover"); });
          T.box.addEventListener("pointerleave", function () { node.classList.remove("k1-hover"); });
          wireTap(T);
        }
        else node.setAttribute("aria-hidden", "true");
      }
      S.T[T.id] = T; S.list.push(T);
      if (movable) { S.settle(T); S.layer(T); S.shadowOf(T); S.name(T); }
      return T;
    };
    // Draw a thing again with other options: a bogie that has been painted.
    S.reart = function (T, args) {
      T = S.id(T); T.args = args; T.sp = A.ART[T.art](args);
      T.node.querySelector(".k1-in").innerHTML = T.flip ? '<g transform="translate(' + T.sp.w + ' 0) scale(-1 1)">' + T.sp.back + "</g>" : T.sp.back;
    };
    S.refs = function () { return S.list.filter(function (t) { return t.role !== "move" && t.role !== "deco"; }); };
    S.movers = function () { return S.list.filter(function (t) { return t.role === "move"; }); };
    S.id = function (id) { return typeof id === "string" ? S.T[id] : id; };

    /* ---- where things rest, and which side of a container's near wall they draw on */
    S.layer = function (T) {
      var inn = S.list.some(function (R) { return R !== T && R.role !== "move" && R.sp.front && R.g.zones.inside && G.REL.inside(T.g, R.g); });
      T.inside = inn;
      var host = inn ? L.mid : L.top, had = document.activeElement === T.node;
      // Moving a node in the page drops its keyboard focus: put it back.
      if (T.node.parentNode !== host || host.lastChild !== T.node) { host.appendChild(T.node); if (had) { try { T.node.focus({ preventScroll: true }); } catch (e) { /* gone */ } } }
    };
    S.settle = function (T) {
      var g = T.g;
      G.move(g, clamp(g.x, 2, W - g.w - 2), clamp(g.y, -g.h * 0.3, H - g.h - 2));
      T.rest = null;
      var holds = S.list.some(function (R) { return R !== T && R.role !== "move" && R.g.zones.inside && G.REL.inside(g, R.g); });
      if (holds) { T.rest = "in"; return; }
      var best = null;
      S.list.forEach(function (R) {
        if (R === T || R.role === "move" || R.role === "deco") return;
        var lines = (R.g.zones.on && R.g.zones.on.line ? [R.g.zones.on.line] : []).concat(R.g.rests || []);
        lines.forEach(function (ln) {
          var b = G.bottom(g);
          if (G.cx(g) >= ln[0] - 6 && G.cx(g) <= ln[1] + 6 && b >= ln[2] - 30 && b <= ln[2] + 14 && (!best || Math.abs(b - ln[2]) < Math.abs(b - best[2]))) best = ln;
        });
      });
      if (best) { G.move(g, g.x, best[2] - g.h); T.rest = best[2]; return; }
      var gb = G.bottom(g);
      if (gb >= S.ground - 34 && gb <= S.ground + 30) { G.move(g, g.x, S.ground - g.h); T.rest = S.ground; }
    };
    S.shadowOf = function (T) {
      if (!T.shadow) return;
      var on = T.rest != null && T.rest !== "in", g = T.g;
      T.shadow.setAttribute("cx", G.cx(g)); T.shadow.setAttribute("cy", on ? T.rest + 1 : 0); T.shadow.setAttribute("rx", g.w * 0.36); T.shadow.setAttribute("ry", Math.max(3, g.h * 0.05));
      T.shadow.setAttribute("opacity", on ? 0.18 : 0);
    };
    S.name = function (T) { if (T.role === "move") T.node.setAttribute("aria-label", T.label + ". Drag it, or press it and then press where it goes, or use the arrow keys."); };

    /* ---- moving */
    S.set = function (T, x, y, glide) {
      T = S.id(T);
      T.node.classList.toggle("k1-glide", !!glide && !reduced());
      G.move(T.g, x, y); paint(T);
    };
    S.moveTo = function (T, x, y, o2) {
      T = S.id(T); o2 = o2 || {};
      S.set(T, x, y, true);
      S.settle(T); paint(T); S.layer(T); S.shadowOf(T);
      S.moved[T.id] = true;
      S.sync();
      if (!o2.quiet) S.emit("drop", T);
    };
    S.reset = function (ids) {
      S.movers().forEach(function (T) { if (ids && ids.indexOf(T.id) < 0) return; S.set(T, T.home.x, T.home.y, true); S.settle(T); paint(T); S.layer(T); S.shadowOf(T); delete S.moved[T.id]; });
      S.select(null);
      S.sync();
    };
    S.lock = function (v) { S.locked = !!v; svg.classList.toggle("k1-locked", !!v); if (v) S.select(null); };
    S.select = function (T) {
      if (S.sel) S.sel.node.classList.remove("sel");
      S.sel = T ? S.id(T) : null;
      if (S.sel) S.sel.node.classList.add("sel");
    };
    /* A thing let go in the air falls: into a container it is over, onto a surface, or to the ground. */
    S.fall = function (T) {
      T = S.id(T);
      var g = T.g, c = G.cx(g), b = G.bottom(g), land = null, where = "floor";
      S.list.forEach(function (R) {
        if (R === T || R.role === "move") return;
        var z = R.g.zones.inside;
        if (z && z.rect && c >= z.rect[0] && c <= z.rect[0] + z.rect[2] && b <= z.rect[1] + z.rect[3] * 0.45) { land = z.rect[1] + z.rect[3] * 0.72; where = "in"; return; }
      });
      if (land == null) {
        var best = null;
        S.list.forEach(function (R) {
          if (R === T || R.role === "move" || R.role === "deco") return;
          var lines = (R.g.zones.on && R.g.zones.on.line ? [R.g.zones.on.line] : []).concat(R.g.rests || []);
          lines.forEach(function (ln) { if (c >= ln[0] && c <= ln[1] && ln[2] >= b - 4 && (best == null || ln[2] < best[2])) best = ln; });
        });
        if (best) { land = best[2]; where = "on"; } else { land = S.ground; where = "floor"; }
      }
      T.node.classList.add("k1-fall");
      G.move(g, g.x, land - g.h); paint(T);
      T.rest = where === "in" ? "in" : land; S.layer(T); S.shadowOf(T);
      S.moved[T.id] = true;
      var done = function () { T.node.classList.remove("k1-fall"); S.emit("landed", T, where); };
      if (reduced()) done(); else setTimeout(done, 520);
    };

    function pt(e) {
      var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      var m = svg.getScreenCTM();
      return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    }
    S.pt = pt;

    function wireMover(T) {
      var drag = null, node = T.node, box = T.box;
      box.addEventListener("pointerdown", function (e) {
        if (S.locked || (e.button != null && e.button > 0)) return;
        e.preventDefault(); e.stopPropagation();
        var p = pt(e);
        drag = { dx: p.x - T.g.x, dy: p.y - T.g.y, sx: e.clientX, sy: e.clientY, moved: false, id: e.pointerId };
        // Raise it before it is captured: moving a captured element in the page lets go of the pointer.
        L.top.appendChild(node); L.hit.appendChild(box);
        try { box.setPointerCapture(e.pointerId); } catch (x) { /* synthetic pointer */ }
      });
      box.addEventListener("pointermove", function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moved) {
          if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
          drag.moved = true; node.classList.add("drag"); node.classList.remove("k1-glide"); S.select(null); SFX.play("pick");
        }
        var p = pt(e);
        G.move(T.g, p.x - drag.dx, p.y - drag.dy); paint(T);
        S.emit("drag", T);
      });
      function end(e) {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        var d = drag; drag = null;
        try { box.releasePointerCapture(d.id); } catch (x) { /* already gone */ }
        node.classList.remove("drag");
        if (!d.moved) { S.layer(T); S.select(S.sel === T ? null : T); if (S.sel === T) SFX.play("pick"); S.emit("pick", T); return; }
        S.set(T, T.g.x, T.g.y, false);
        if (S.gravity) { S.fall(T); S.emit("drop", T); return; }
        S.settle(T); paint(T); S.layer(T); S.shadowOf(T);
        S.moved[T.id] = true;
        S.emit("drop", T);
      }
      box.addEventListener("pointerup", end);
      box.addEventListener("pointercancel", end);
      // The keyboard: arrows move it, Enter or Space picks it up and puts it down again.
      var kt = null;
      node.addEventListener("keydown", function (e) {
        if (S.locked) return;
        var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (d) {
          e.preventDefault();
          var st = e.shiftKey ? 40 : 14;
          S.set(T, T.g.x + d[0] * st, T.g.y + d[1] * st, false); S.emit("drag", T);
          clearTimeout(kt);
          kt = setTimeout(function () {
            if (S.gravity) { S.fall(T); S.emit("drop", T); return; }
            S.settle(T); paint(T); S.layer(T); S.shadowOf(T); S.moved[T.id] = true; S.emit("drop", T);
          }, 450);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); e.stopPropagation(); S.select(S.sel === T ? null : T); if (S.sel === T) SFX.play("pick"); S.emit("pick", T);
        }
      });
    }
    // Tap a thing, then tap where it should go: it lands with its feet on the spot.
    svg.addEventListener("pointerdown", function (e) {
      if (S.locked || !S.sel) return;
      if (e.target.closest && e.target.closest(".k1-role-move")) return;
      var T = S.sel, p = pt(e);
      S.select(null);
      S.moveTo(T, p.x - T.g.w / 2, p.y - T.g.h, { quiet: true });
      if (S.gravity) { S.fall(T); }
      S.emit("drop", T);
    });

    function wireTap(T) {
      function fire(e) { if (S.locked) return; if (e && e.preventDefault) e.preventDefault(); S.emit("tap", T); }
      T.box.addEventListener("click", fire);
      // Enter on a thing taps it; it must not also press the card's Check or Continue.
      T.node.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); fire(e); } });
    }

    /* ---- marks drawn over things: a ring, a tick, a number */
    S.marks = {};
    S.mark = function (T, kind, text) {
      T = S.id(T); S.unmark(T, kind);
      var g = T.g, r = Math.max(g.w, g.h) / 2 + 6, c = svgEl("g", { class: "k1-mark k1-m-" + kind, "data-for": T.id }, L.over);
      if (kind === "ring" || kind === "ok" || kind === "no" || kind === "before" || kind === "after" || kind === "me") {
        svgEl("rect", { x: g.x - 6, y: g.y - 6, width: g.w + 12, height: g.h + 12, rx: 16, class: "k1-ringline" }, c);
      }
      if (kind === "tick") {
        svgEl("circle", { cx: g.x + g.w - 6, cy: g.y + 6, r: 15, class: "k1-tickbg" }, c);
        svgEl("path", { d: "M" + (g.x + g.w - 13) + " " + (g.y + 6) + "l5 5 10-11", class: "k1-tickmark", fill: "none" }, c);
      }
      if (kind === "num") {
        svgEl("circle", { cx: G.cx(g), cy: g.y - 6, r: 17, class: "k1-numbg" }, c);
        var tx = svgEl("text", { x: G.cx(g), y: g.y, class: "k1-numtx", "text-anchor": "middle" }, c); tx.textContent = text;
      }
      if (kind === "tag") {
        var tw = Math.max(34, String(text).length * 11 + 16);
        svgEl("rect", { x: G.cx(g) - tw / 2, y: g.y - 30, width: tw, height: 24, rx: 12, class: "k1-tagbg" }, c);
        var t2 = svgEl("text", { x: G.cx(g), y: g.y - 13, class: "k1-tagtx", "text-anchor": "middle" }, c); t2.textContent = text;
      }
      (S.marks[T.id] = S.marks[T.id] || {})[kind] = c;
      return c;
    };
    S.unmark = function (T, kind) {
      T = S.id(T); var m = S.marks[T.id];
      if (!m) return;
      Object.keys(m).forEach(function (k) { if (!kind || k === kind) { m[k].remove(); delete m[k]; } });
    };
    S.clearMarks = function () { Object.keys(S.marks).forEach(function (id) { S.unmark(id); }); };
    S.text = function (x, y, str, cls) { var t = svgEl("text", { x: x, y: y, class: "k1-label " + (cls || ""), "text-anchor": "middle" }, L.back); t.textContent = str; return t; };
    // A dashed outline round a region of a thing: where it should go.
    S.hint = function (R, zone, ms) {
      R = S.id(R); var z = R.g.zones[zone], c;
      if (!z) return;
      if (z.rect) c = svgEl("rect", { x: z.rect[0] - 4, y: z.rect[1] - 4, width: z.rect[2] + 8, height: z.rect[3] + 8, rx: 14, class: "k1-zonehint" }, L.over);
      else c = svgEl("rect", { x: z.line[0] - 4, y: z.line[2] - 30, width: z.line[1] - z.line[0] + 8, height: 38, rx: 14, class: "k1-zonehint" }, L.over);
      setTimeout(function () { c.remove(); }, ms || 3200);
    };

    /* ---- the picture as a named graph, and what can be done to it
       Every thing is a node with a name ("moti", "table") that says what is true
       of it just now, in the same attributes a screen reader reads. Anything that
       wants to point at the picture — a hint, the nudge after a quiet moment, one
       day a tutor — does it through `act`, which only takes names that are in the
       graph: a made-up name is turned away, not drawn. */
    svg.setAttribute("data-scene-graph-node", "true");
    svg.setAttribute("data-scene-graph-name", "scene");
    svg.__k1 = S;
    // What is true of a thing, as a plain sentence: "Moti is on the table."
    S.state = function (T) {
      T = S.id(T);
      if (T.role !== "move") return T.label;
      var plural = !!T.spec.plural;
      for (var i = 0; i < S.list.length; i++) {
        var R = S.list[i];
        if (R === T || R.role === "move" || R.role === "deco") continue;
        var rel = G.which(T.g, R.g);
        if (rel) return G.plain(G.sentence(T.label, rel, R.label, plural));
      }
      if (T.rest === S.ground && S.groundLabel) return G.plain(G.sentence(T.label, "on", S.groundLabel, plural));
      return T.label;
    };
    S.sync = function () {
      S.list.forEach(function (T) {
        if (T.role === "deco") return;
        T.node.setAttribute("data-scene-graph-node", "true");
        T.node.setAttribute("data-scene-graph-name", T.id);
        T.node.setAttribute("aria-description", S.state(T));
      });
    };
    S.graph = function () {
      return { name: "scene", description: spec.alt || "", children: S.list.filter(function (T) { return T.role !== "deco"; }).map(function (T) {
        return { name: T.id, label: T.label, role: T.role, description: S.state(T) };
      }) };
    };
    // The graph as text, one line a node: what a tutor (or a test) is handed.
    S.text = function () {
      var g = S.graph();
      return ["scene: " + g.description].concat(g.children.map(function (c) { return "\t" + c.name + ": " + c.description; })).join("\n");
    };
    S.on("drop", S.sync); S.on("landed", S.sync);
    S.on("drop", function () { SFX.play("drop"); });

    /* A ring that pulses round a thing says "this one". Every ring beats on one
       clock (two seconds a beat) that is told to play, to settle — finish the beat
       it is in — or to pause, so rings made at different moments stay in step and
       nothing is cut off half way. */
    var PERIOD = 2000, pstate = "paused", pstart = 0, psettle = null, flashT = null, rings = [];
    function pnow() { var t = document.timeline && document.timeline.currentTime; return typeof t === "number" ? t : performance.now(); }
    function psync() {
      [].forEach.call(svg.querySelectorAll("[data-synced-to-pulse-timer]"), function (n) {
        if (!n.getAnimations) return;
        n.getAnimations().forEach(function (a) {
          try { a.effect.updateTiming({ duration: PERIOD, iterations: Infinity }); } catch (e) { /* not a timed animation */ }
          if (pstate === "paused") { try { a.pause(); a.currentTime = 0; } catch (e) { /* gone */ } }
          else { try { a.play(); a.startTime = pstart; } catch (e) { /* gone */ } }
        });
      });
      svg.classList.toggle("k1-pulsing", pstate !== "paused");
    }
    function clearRings() { rings.forEach(function (r) { r.remove(); }); rings = []; }
    S.pulseState = function () { return pstate; };
    S.pulse = function (state) {
      clearTimeout(psettle); psettle = null;
      if (state === "playing") { if (pstate === "paused") pstart = pnow(); pstate = "playing"; psync(); }
      else if (state === "settling" && pstate !== "paused") {
        var left = PERIOD - ((pnow() - pstart) % PERIOD);
        pstate = "settling"; psync();
        psettle = setTimeout(function () { pstate = "paused"; psync(); clearRings(); }, left);
      } else if (state === "paused") { pstate = "paused"; psync(); clearRings(); }
    };
    // actions: [ { tag: "highlight", ids: [...] } | { tag: "clear" } ] → { rejected: [names that are not in the picture] }
    S.act = function (actions) {
      var rejected = [];
      (actions || []).forEach(function (a) {
        if (!a) return;
        if (a.tag === "clear") { clearRings(); return; }
        if (a.tag !== "highlight") return;
        (a.ids || []).forEach(function (id) {
          var T = typeof id === "string" ? S.T[id] : null;
          if (!T || T.role === "deco") { rejected.push(id); return; }
          var g = T.g;
          rings.push(svgEl("rect", { class: "k1-pulse", "data-synced-to-pulse-timer": "", "data-for": id, x: g.x - 9, y: g.y - 9, width: g.w + 18, height: g.h + 18, rx: 18 }, L.over));
        });
        psync();
      });
      return { rejected: rejected };
    };
    // Ring these for a couple of beats, then let them settle.
    S.flash = function (ids, beats) {
      var r = S.act([{ tag: "clear" }, { tag: "highlight", ids: ids }]);
      S.pulse("playing");
      clearTimeout(flashT);
      flashT = setTimeout(function () { S.pulse("settling"); }, (beats || 2) * PERIOD - 60);
      return r;
    };
    // A kind says which things a child who has gone quiet should be pointed at.
    S.nudge = null;

    (spec.things || []).forEach(function (ts) { S.add(ts); });
    (spec.labels || []).forEach(function (l) { S.text(l.x, l.y, l.t, l.cls); });
    S.sync();
    S.destroy = function () { clearTimeout(psettle); clearTimeout(flashT); svg.remove(); S.ev = {}; };
    return S;
  }

  /* A picture that does nothing: a scene drawn once, for a step's art. */
  function still(spec, cls) {
    var S = Scene(spec);
    S.svg.removeAttribute("tabindex");
    S.svg.setAttribute("role", "img");
    var d = document.createElement("div");
    d.className = "k1-still " + (cls || "");
    d.appendChild(S.svg);
    return d.outerHTML;
  }

  /* ============================================================ The card
     Each Grade 1 step gets a speaker in its corner, and reads itself when it
     opens. What the guide says after Check is read too. */
  var spk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.6a8 8 0 0 1 0 10.8"/></svg>';
  var mute = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>';
  var bellOn = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 5.5 2 7 2 7H4s2-1.5 2-7"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>';
  var bellOff = bellOn.replace("</svg>", '<path d="m4 4 16 16"/></svg>');
  // A child who has gone quiet is pointed at what to move or tap: 8 s, and never while the voice is still reading.
  var IDLE_MS = 8000;
  function idleMs() { return window.__OPLO_TEST && window.__K1_IDLE ? window.__K1_IDLE : IDLE_MS; }

  CH.cardHook = function (card, s, reg) {
    if (!s || !s.k1) return;
    var text = s.say != null ? s.say : G.plain(s.prompt || s.t || "");
    if (VOICE.can || SFX.can) {
      var bar = el("div", "k1-voice");
      if (VOICE.can) {
        var lis = button("k1-listen", spk + "<span>Listen</span>");
        lis.setAttribute("aria-label", "Read this to me");
        lis.addEventListener("click", function () { VOICE.say(text, { force: true }); });
        var sw = button("k1-vsw", VOICE.isOn() ? spk : mute);
        sw.setAttribute("role", "switch"); sw.setAttribute("aria-checked", String(VOICE.isOn())); sw.setAttribute("aria-label", "Read every screen aloud");
        sw.title = VOICE.isOn() ? "Reading aloud is on. Press to turn it off." : "Reading aloud is off. Press to turn it on.";
        var sync = function (on) { sw.innerHTML = on ? spk : mute; sw.setAttribute("aria-checked", String(on)); sw.classList.toggle("off", !on); sw.title = on ? "Reading aloud is on. Press to turn it off." : "Reading aloud is off. Press to turn it on."; };
        sync(VOICE.isOn());
        sw.addEventListener("click", function () { VOICE.set(!VOICE.isOn()); sync(VOICE.isOn()); if (VOICE.isOn()) VOICE.say(text); });
        VOICE.sub(sync);
        bar.appendChild(lis); bar.appendChild(sw);
      }
      if (SFX.can) {
        var bw = button("k1-vsw k1-ssw", SFX.isOn() ? bellOn : bellOff);
        bw.setAttribute("role", "switch"); bw.setAttribute("aria-label", "Play little sounds");
        var bsync = function (on) { bw.innerHTML = on ? bellOn : bellOff; bw.setAttribute("aria-checked", String(on)); bw.classList.toggle("off", !on); bw.title = on ? "Little sounds are on. Press to turn them off." : "Little sounds are off. Press to turn them on."; };
        bsync(SFX.isOn());
        bw.addEventListener("click", function () { SFX.set(!SFX.isOn()); bsync(SFX.isOn()); SFX.play("tap"); });
        SFX.sub(bsync);
        bar.appendChild(bw);
      }
      card.appendChild(bar);
    }
    // The end card has no problem on it: it gets the fanfare, once.
    if (s.prompt == null && s.t == null && s.say != null) SFX.play("done");
    var t = setTimeout(function () { VOICE.say(text); }, reduced() ? 120 : 420);
    var seen = "", heard = "", vt = null;
    var mo = typeof MutationObserver === "function" ? new MutationObserver(function () {
      var sh = card.querySelector(".ch-sheet.on");
      if (!sh) { seen = ""; heard = ""; return; }
      // The verdict has a sound of its own, once each time it changes.
      var kind = sh.classList.contains("ok") ? "yes" : sh.classList.contains("no") ? "no" : sh.classList.contains("shown") ? "shown" : "";
      if (kind && kind !== heard) { heard = kind; SFX.play(kind); }
      var tx = G.plain(sh.innerHTML);
      if (tx && tx !== seen) {
        seen = tx;
        // The chime lands first, then the words, so the chime does not cover the first of them.
        clearTimeout(vt);
        if (kind && SFX.isOn() && SFX.can) vt = setTimeout(function () { VOICE.say(tx); }, 320); else VOICE.say(tx);
      }
    }) : null;
    if (mo) mo.observe(card, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });

    /* The quiet moment. Nothing touched for a while on a step that is still
       open: whatever the picture says can be moved or tapped starts to glow,
       on the one clock; the first touch lets the glow finish its beat. */
    var idle = null, glowing = [];
    function scenes() { return [].map.call(card.querySelectorAll(".k1-svg"), function (n) { return n.__k1; }).filter(function (S) { return S && S.nudge; }); }
    function open() { return !card.querySelector(".ch-sheet.ok, .ch-sheet.shown"); }
    function arm() { clearTimeout(idle); idle = setTimeout(go, idleMs()); }
    function go() {
      if (!open()) return;
      if (VOICE.speaking()) { arm(); return; }
      scenes().forEach(function (S) {
        var ids = S.nudge();
        if (ids && ids.length) { S.act([{ tag: "clear" }, { tag: "highlight", ids: ids }]); S.pulse("playing"); glowing.push(S); }
      });
    }
    function calm() {
      glowing.forEach(function (S) { S.pulse("settling"); });
      glowing = [];
      arm();
    }
    card.addEventListener("pointerdown", calm, true);
    card.addEventListener("keydown", calm, true);
    arm();
    reg(function () { clearTimeout(t); clearTimeout(idle); clearTimeout(vt); if (mo) mo.disconnect(); VOICE.stop(); });
  };

  window.OPLO_K1 = { Scene: Scene, still: still, VOICE: VOICE, SFX: SFX, G: G, A: A, el: el, esc: esc, button: button, svgEl: svgEl, reduced: reduced, later: later, clamp: clamp, spk: spk };
})();
