/* ==========================================================================
   OEdu Lab — the business kit. See lab/core.js (COURSE_KIT) and lab/widgets.js.

   Loaded after the manipulatives and before any Introduction to Business
   unit. Every scene here is a step kind like the math ones: it returns
   { el, ready, check, reveal } and runs as a problem, or, on an idea card,
   as something to explore that can hold Continue until the move that shows
   the idea has been made.

     grab        concept cards to grab into your deck — a term, its picture,
     what        it means and an example, as a card you collect
     opener      a lesson's title card: its number, its name, the mission,
     and         the concepts it hands out, orbiting its emblem
     myth        a myth buster: a claim most people believe, a vote, the
     clues       one at a time, then the claim cracks — BUSTED
     flip        cards you turn over one at a time: a picture and a name on
     the         front, what it means on the back
     chain       a cause and its effects, one link at a time
     amount      a number typed the way business writes it: 1,250 · $1,250 ·
     -$40        · 4.5% — commas are thousands, never decimals
     deck        a lesson's last step: the concept cards it handed out,
     face        down to recall, and the unit's deck filling up
     profit      run a stand for a day: set the price and how many you sell,
     and         watch money in, money out and what is left
     stops       a line from one extreme to the other with a few stops on it;
     at          each, a card of what is true there (economic systems,
     market      structures)
     flow        the circular flow: households, businesses and government,
     with        money (yellow) and real things (blue) moving between
     cycle       real GDP quarter by quarter: scrub through time and read the
     phase;      runs of two or more falling quarters are recessions
     labor       count a town's labor force: tap a person, then where they
     belong;     the unemployment rate builds as you go
     basket      what your pay buys: prices rise, your pay may rise too — how
     many        baskets can you still afford?
     levers      the control room: the Fed's interest rate, and the
     government's taxes and spending; three gauges answer
     market      supply and demand: move the price and watch the gap between
     what        buyers want and sellers offer; shift the curves with
     events      and watch the equilibrium move
     retain      keeping customers: how many are left after five years if a
     business    loses a share of them every year
     dilemma     a hard choice: pick an option and see how it lands on each
     person      or group it touches — then try the others
     pyramid     a pyramid built from the bottom up — each level only
     appears     once the one beneath it is in place (the CSR pyramid)
     hub         one thing in the middle and the groups around it: tap each
     to          see what it expects (a company and its stakeholders)
   Also here for the units: L.B (the helpers), L.icon and L.card (line
   pictures for cards), L.tiles (a row of pictures), L.photo (the course's
   photographs, each with its credit) and L.usd (dollars for lesson text).

   Built from the business build folder (kit/*.js) by assemble.py.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_LAB || !window.OPLO_CHALLENGE) return;

  /* =============================================================== Parts
     What every business scene is built from: the widgets' own helpers
     (lab/widgets.js), money written the way a price tag writes it, a frame
     for a chart, a live line of words, a row of big numbers, and the
     course's pictures. */
  var LAB = window.OPLO_LAB, CH = window.OPLO_CHALLENGE;
  var el = LAB.el, esc = LAB.esc, button = LAB.button, fmt = LAB.fmt, m = LAB.m, num = LAB.num;
  var B = {};
  var NS = "http://www.w3.org/2000/svg";

  /* The drawing helpers, the same as lab/widgets.js's own (kept here so the
     kit does not depend on that file's internals). */
  function S(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgRoot(w, h, cls) {
    var s = S("svg", { viewBox: "0 0 " + w + " " + h, class: "lw-svg " + (cls || "") });
    s.setAttribute("role", "img");
    return s;
  }
  function svgPt(svg, e) {
    var p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    var mtx = svg.getScreenCTM();
    return mtx ? p.matrixTransform(mtx.inverse()) : { x: 0, y: 0 };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function snapTo(v, step) { return step ? Math.round(v / step) * step : v; }
  /* Drag an SVG element with the pointer; also move it with the arrow keys
     once focused. o: { move(pt), key(dx, dy, shift), start(), end(), disabled() } */
  function draggable(svg, handle, o) {
    var active = false;
    handle.setAttribute("tabindex", "0");
    handle.classList.add("lw-drag");
    handle.addEventListener("pointerdown", function (e) {
      if (o.disabled && o.disabled()) return;
      e.preventDefault();
      active = true;
      try { handle.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ }
      handle.classList.add("on");
      if (o.start) o.start();
      o.move(svgPt(svg, e));
    });
    handle.addEventListener("pointermove", function (e) { if (active) o.move(svgPt(svg, e)); });
    function end() { if (!active) return; active = false; handle.classList.remove("on"); if (o.end) o.end(); }
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
    handle.addEventListener("keydown", function (e) {
      if (o.disabled && o.disabled()) return;
      var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (!d || !o.key) return;
      e.preventDefault();
      o.key(d[0], d[1], e.shiftKey);
      if (o.end) o.end();
    });
  }
  /* A labelled range input: slider("Price", { min, max, step, v, show(v) → text }, onInput). */
  function slider(label, o, onInput) {
    var row = el("label", "lw-slider");
    var name = el("span", "lw-sl-name", fmt(label));
    var input = el("input");
    input.type = "range";
    input.min = o.min; input.max = o.max; input.step = o.step || 1; input.value = o.v;
    input.setAttribute("aria-label", String(label).replace(/<[^>]+>|\$|\\[a-z]+|[{}]/g, ""));
    var val = el("span", "lw-sl-val");
    row.appendChild(name); row.appendChild(input); row.appendChild(val);
    function show() {
      val.innerHTML = o.show ? fmt(o.show(+input.value)) : m(num(+input.value));
      // How far along the track the handle is, for a track that fills behind it.
      var span = (+input.max) - (+input.min);
      input.style.setProperty("--p", (span ? ((+input.value) - (+input.min)) / span * 100 : 0).toFixed(1) + "%");
    }
    input.addEventListener("input", function () { show(); onInput(+input.value); });
    show();
    return { el: row, input: input, set: function (v) { input.value = v; show(); } };
  }
  function note(cls, html) { return el("div", "lw-note " + (cls || ""), html); }

  /* ------------------------------------------------------------- Numbers
     money(1250) → "$1,250", money(-40) → "−$40", money(2.5) → "$2.50".
     For an SVG label or a readout. usd() is the same for lesson text, where
     a bare $ would start maths: usd(1250) → "\$1,250". */
  function commas(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function money(v, o) {
    o = o || {};
    var neg = v < -1e-9, a = Math.abs(v);
    var dp = o.dp != null ? o.dp : (Math.abs(a - Math.round(a)) < 1e-9 ? 0 : 2);
    var p = a.toFixed(dp).split(".");
    p[0] = commas(p[0]);
    return (neg ? "−" : o.plus && a > 1e-9 ? "+" : "") + "$" + p.join(".");
  }
  function usd(v, o) { return money(v, o).replace("$", "\\$"); }
  function count(v) { return commas(String(Math.round(v))); }            // 12500 → "12,500"
  function pct(v, dp) {                                                 // 4.5 → "4.5%", 25 → "25%"
    var r = Math.round(v * Math.pow(10, dp || 0)) / Math.pow(10, dp || 0);
    return (Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : String(r)) + "%";
  }
  function round(v, dp) { var k = Math.pow(10, dp || 0); return Math.round(v * k) / k; }

  /* ----------------------------------------------------------------- Style
     Each scene adds its rules once, into one <style> of the kit's own. All
     colour comes from tokens (--lw-* from lab.css, --ink/--paper/... from the
     app), so a scene reads the same on the light console and on Obsidian. */
  var styleEl = null;
  function css(text) {
    if (!styleEl) {
      var old = document.getElementById("bizkit-css");
      if (old) old.parentNode.removeChild(old);
      styleEl = document.createElement("style");
      styleEl.id = "bizkit-css";
      document.head.appendChild(styleEl);
    }
    styleEl.appendChild(document.createTextNode(text));
  }

  /* ---------------------------------------------------------------- Motion */
  function reduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  /* Ease a number from a to b over ms, calling step(v) each frame; done() at
     the end. With reduced motion, or a hidden page, it jumps straight there.
     Returns a function that stops it. */
  function tween(a, b, ms, step, done) {
    if (reduced() || document.hidden || !(ms > 0)) { step(b); if (done) done(); return function () {}; }
    var t0 = null, raf = 0, dead = false;
    function f(t) {
      if (dead) return;
      if (t0 == null) t0 = t;
      var k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      step(a + (b - a) * e);
      if (k < 1) raf = requestAnimationFrame(f); else if (done) done();
    }
    raf = requestAnimationFrame(f);
    return function () { dead = true; cancelAnimationFrame(raf); };
  }

  /* ----------------------------------------------------------------- Chart
     A frame to plot in: axes, ticks, light gridlines, axis names, and the
     maps between values and the drawing.
       o: { w, h, pad: [top, right, bottom, left], x: [lo, hi], y: [lo, hi],
            xticks: [..], yticks: [..], xfmt(v), yfmt(v), xlabel, ylabel,
            grid: true | false | "both", cls }
       → { svg, plot, over, X(v), Y(v), iX(px), iY(py), w, h, pad }
     `plot` is drawn above the axes; `over` above that (handles, labels). */
  function chart(o) {
    var w = o.w || 560, h = o.h || 340, p = o.pad || [16, 20, 48, 64];
    var svg = svgRoot(w, h, "bz-chart " + (o.cls || ""));
    var x0 = p[3], x1 = w - p[1], y0 = h - p[2], y1 = p[0];
    function X(v) { return x0 + (v - o.x[0]) / (o.x[1] - o.x[0]) * (x1 - x0); }
    function Y(v) { return y0 - (v - o.y[0]) / (o.y[1] - o.y[0]) * (y0 - y1); }
    function iX(px) { return o.x[0] + (px - x0) / (x1 - x0) * (o.x[1] - o.x[0]); }
    function iY(py) { return o.y[0] + (y0 - py) / (y0 - y1) * (o.y[1] - o.y[0]); }
    var ax = S("g", { class: "bz-axes" }, svg);
    (o.yticks || []).forEach(function (v) {
      if (o.grid !== false) S("line", { x1: x0, x2: x1, y1: Y(v), y2: Y(v), class: "bz-grid" }, ax);
      S("text", { x: x0 - 8, y: Y(v) + 4, class: "bz-tick", "text-anchor": "end" }, ax).textContent = o.yfmt ? o.yfmt(v) : String(v);
    });
    (o.xticks || []).forEach(function (v) {
      if (o.grid === "both") S("line", { x1: X(v), x2: X(v), y1: y0, y2: y1, class: "bz-grid" }, ax);
      S("text", { x: X(v), y: y0 + 18, class: "bz-tick", "text-anchor": "middle" }, ax).textContent = o.xfmt ? o.xfmt(v) : String(v);
    });
    S("line", { x1: x0, x2: x1, y1: y0, y2: y0, class: "bz-axis" }, ax);
    S("line", { x1: x0, x2: x0, y1: y0, y2: y1, class: "bz-axis" }, ax);
    if (o.xlabel) S("text", { x: (x0 + x1) / 2, y: h - 6, class: "bz-alabel", "text-anchor": "middle" }, ax).textContent = o.xlabel;
    if (o.ylabel) S("text", { x: 0, y: 0, class: "bz-alabel", "text-anchor": "middle",
                              transform: "translate(15," + (y0 + y1) / 2 + ") rotate(-90)" }, ax).textContent = o.ylabel;
    var plot = S("g", { class: "bz-plot" }, svg), over = S("g", { class: "bz-over" }, svg);
    return { svg: svg, plot: plot, over: over, X: X, Y: Y, iX: iX, iY: iY, w: w, h: h, pad: p,
             left: x0, right: x1, top: y1, bottom: y0 };
  }

  /* ------------------------------------------------------------- Controls */
  // A live line of words under a scene, read out to a screen reader.
  function readout(cls) {
    var r = el("div", "bz-read " + (cls || ""));
    r.setAttribute("role", "status");
    r.setAttribute("aria-live", "polite");
    return r;
  }
  // A row of big numbers: kpis([{ k: "rev", label: "Revenue", color: "blue" }, …]) → { el, set(k, html, tone) }.
  function kpis(list) {
    var row = el("div", "bz-kpis"), cells = {};
    list.forEach(function (x) {
      var c = el("div", "bz-kpi" + (x.color ? " k-" + x.color : ""));
      c.innerHTML = "<small>" + esc(x.label) + "</small><b>–</b>";
      cells[x.k] = c;
      row.appendChild(c);
    });
    return {
      el: row,
      set: function (k, html, tone) {
        var c = cells[k];
        if (!c) return;
        c.querySelector("b").innerHTML = html;
        c.classList.remove("good", "bad");
        if (tone) c.classList.add(tone);
      }
    };
  }
  // A segmented control: seg([{ k, label }], onPick, current) → { el, set(k), get() }.
  function seg(items, onPick, cur) {
    var box = el("div", "bz-seg"), val = cur;
    box.setAttribute("role", "group");
    var btns = items.map(function (it) {
      var b = button("bz-segb", it.label);
      b.addEventListener("click", function () { set(it.k); onPick(it.k); });
      box.appendChild(b);
      return { k: it.k, b: b };
    });
    function set(k) {
      val = k;
      btns.forEach(function (x) { x.b.classList.toggle("on", x.k === k); x.b.setAttribute("aria-pressed", String(x.k === k)); });
    }
    set(cur);
    return { el: box, set: set, get: function () { return val; } };
  }
  function btn(label, cls) { return button("lw-btn " + (cls || ""), label); }

  /* ------------------------------------------------------------- Pictures
     Line pictures, 24 × 24, drawn in the colour of the text around them:
     icon("store") → an <svg> string for cards, tiles and prompts;
     iconAt(g, "store", x, y, size, cls) puts one inside a scene's drawing. */
  var ICONS = {
    store: '<path d="M4 10v10h16V10"/><path d="M2.5 10 5 4h14l2.5 6z"/><path d="M10 20v-5h4v5"/>',
    truck: '<path d="M2 6h11v10H2z"/><path d="M13 9h4l3 3v4h-7"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    factory: '<path d="M3 20V10l5 3V10l5 3V10l5 3V4h3v16z"/><path d="M7 17h2M12 17h2"/>',
    house: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    capitol: '<path d="M4 21h16M5 18h14M7 18v-6M11 18v-6M13 18v-6M17 18v-6M5 12h14"/><path d="M8 12a4 4 0 0 1 8 0"/><path d="M12 8V4"/>',
    bank: '<path d="M3 21h18M4 18h16M12 3 3 8h18z"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8"/>',
    person: '<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 4.8"/>',
    worker: '<path d="M5 12a7 7 0 0 1 14 0"/><path d="M3.5 12h17"/><path d="M12 5v3"/><path d="M7 15a5 5 0 0 0 10 0"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="2.6"/><path d="M3 7v4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7"/><path d="M9 13.6v3c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4c0-1.2-2-2.2-4.6-2.5"/>',
    card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    hand: '<path d="M3 13h3l3 1.5h4a1.5 1.5 0 0 1 0 3H9"/><path d="M13 17.5l5-2.5a1.6 1.6 0 0 1 1.8 2.6L14 21H6l-3-1.5"/><path d="M12 10.5s-3.5-2-3.5-4.3A2 2 0 0 1 12 5a2 2 0 0 1 3.5 1.2c0 2.3-3.5 4.3-3.5 4.3z"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
    doctor: '<path d="M5 3v6a5 5 0 0 0 10 0V3"/><path d="M10 14v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>',
    hospital: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M12 8v6M9 11h6"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
    shirt: '<path d="M8 3 4 5.5 2.5 10l3.5 1.2V21h12V11.2l3.5-1.2L20 5.5 16 3a4 4 0 0 1-8 0z"/>',
    shoe: '<path d="M3 17v-5l3-1 2-4 3 1-1 3 4 2 6 1.5a2 2 0 0 1 1 1.8V17z"/><path d="M3 17h18"/>',
    pizza: '<path d="M12 21 3 6a15 15 0 0 1 18 0z"/><circle cx="10" cy="10" r="1.2"/><circle cx="14" cy="12" r="1.2"/><circle cx="12" cy="16" r="1"/>',
    coffee: '<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5v2.5M12 2.5v2.5"/>',
    burger: '<path d="M4 11a8 5 0 0 1 16 0z"/><path d="M3 14h18"/><path d="M4 17h16a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/>',
    apple: '<path d="M12 7c-2-1.5-7-1-7 4.5C5 16 8 21 10 21c1 0 1.2-.6 2-.6s1 .6 2 .6c2 0 5-5 5-9.5C19 6 14 5.5 12 7z"/><path d="M12 7c0-2 1-3.5 3-4"/>',
    lemon: '<path d="M4.5 13.5c0-4.8 4-8.5 8.8-8.5 1.6 0 3 .4 4.2 1.1l1.9-.6-.6 1.9c.7 1.2 1.1 2.6 1.1 4.1 0 4.8-4 8.5-8.8 8.5-1.6 0-3-.4-4.2-1.1l-1.9.6.6-1.9c-.7-1.2-1.1-2.6-1.1-4.1z"/><path d="M9 11.5c.5-1.6 1.8-2.8 3.5-3.2"/>',
    wheat: '<path d="M12 21V8"/><path d="M12 12c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 12c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 16.5c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 16.5c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 8c-1.5-1-1.5-3.5 0-5 1.5 1.5 1.5 4 0 5z"/>',
    tree: '<path d="M12 21v-5"/><path d="M12 3 6 12h3l-4 5h14l-4-5h3z"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    barrel: '<ellipse cx="12" cy="5" rx="6" ry="2"/><path d="M6 5v14c0 1.1 2.7 2 6 2s6-.9 6-2V5"/><path d="M6 10c0 1.1 2.7 2 6 2s6-.9 6-2M6 15c0 1.1 2.7 2 6 2s6-.9 6-2"/>',
    mountain: '<path d="M2.5 20 9 8l4 7 2.5-4 6 9z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    bolt: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    hammer: '<path d="M13 7 4 16a2 2 0 0 0 3 3l9-9"/><path d="M11 5l4-2 6 6-2 4z"/>',
    flame: '<path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7 10 6 12.5 6 15a6 6 0 0 0 6 6z"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    cap: '<path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/>',
    ship: '<path d="M3 17l2 4h14l2-4z"/><path d="M5 17v-6h14v6"/><path d="M9 11V6h6v5"/>',
    up: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
    down: '<path d="M3 7l6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M2 20h20"/>',
    scale: '<path d="M12 3v18M7 21h10M4 7h16"/><path d="M4 7l-2.5 6a3 3 0 0 0 5 0zM20 7l-2.5 6a3 3 0 0 0 5 0z"/>',
    heart: '<path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10z"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
    robot: '<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 8V4.5"/><circle cx="12" cy="3.5" r="1"/><circle cx="9" cy="13" r="1.2"/><circle cx="15" cy="13" r="1.2"/><path d="M9.5 16.5h5M3 12v3M21 12v3"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 8.5a4.8 4.8 0 0 1-.5 9.5z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 21h8M9.5 17h5v4h-5z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    snow: '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6"/><path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19 13 11"/>',
    plane: '<path d="M21.5 3 2.5 10.5l7 2.5 2.5 7z"/><path d="M21.5 3 9.5 13"/>',
    car: '<path d="M5 16H3v-4l2-5h12l3 5h1v4h-2"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/><path d="M9.5 16.5h5M4 12h17"/>',
    bus: '<rect x="4" y="3.5" width="16" height="14" rx="2"/><path d="M4 11h16M8 21v-3.5M16 21v-3.5"/><circle cx="8" cy="14.5" r=".8"/><circle cx="16" cy="14.5" r=".8"/>',
    bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l2.5 8H6M13 5h3"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4 2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 1 0-4V6H3z"/><path d="M14 7v2M14 11v2M14 15v2"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 3.5h3l2.5 12h11l2-8H6.5"/>',
    basket: '<path d="M3 10h18l-2 10H5z"/><path d="M8 10l3-6M16 10l-3-6M9 14v3M12 14v3M15 14v3"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    alliance: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    megaphone: '<path d="M3 10v4h3l8 5V5L6 10z"/><path d="M17.5 9a4 4 0 0 1 0 6M20 6.5a8 8 0 0 1 0 11"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    jar: '<path d="M7 7h10v2a4 4 0 0 1 2 3.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6.5A4 4 0 0 1 7 9z"/><path d="M7 4h10v3H7z"/><path d="M12 12v6M10 14h3.5a1.2 1.2 0 0 1 0 2.4H10"/>',
    check: '<path d="M4 12.5 9.5 18 20 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".6"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    news: '<rect x="3" y="4.5" width="15" height="15" rx="1.5"/><path d="M18 8h2.5v9.5a2 2 0 0 1-4 0V8M6.5 8.5h8M6.5 12h8M6.5 15.5h5"/>',
    book: '<path d="M4 4.5h6.5A2.5 2.5 0 0 1 13 7v12a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6.5A2.5 2.5 0 0 0 11 7v12a2 2 0 0 1 2-2h7z"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5C10 8.5 7.5 7.8 7.5 6a2 2 0 0 1 4-.5L12 8.5l.5-3a2 2 0 0 1 4 .5c0 1.8-2.5 2.5-4.5 2.5z"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/>'
  };
  function icon(name, cls) {
    var p = ICONS[name] || ICONS.question;
    return '<svg class="bz-ic ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"' +
           ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>";
  }
  function iconAt(g, name, x, y, size, cls) {
    var k = (size || 24) / 24;
    var n = S("g", { transform: "translate(" + (x - (size || 24) / 2) + "," + (y - (size || 24) / 2) + ") scale(" + k + ")",
                     class: "bz-gic " + (cls || ""), fill: "none", stroke: "currentColor", "stroke-width": 1.8 / Math.max(k, 0.6),
                     "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    n.innerHTML = ICONS[name] || ICONS.question;
    return n;
  }
  /* A sort or choice card with its picture: card("pizza", "A slice of pizza"). */
  function card(name, text) { return '<span class="bz-card">' + icon(name) + "<span>" + text + "</span></span>"; }
  /* A row of pictures with a word under each, for an idea card's `art`:
     tiles([{ i: "wheat", t: "Flour" }, { i: "person", t: "The cook", c: "blue" }]). */
  function tiles(list, cap) {
    return '<figure class="bz-tiles">' + '<div class="bz-trow">' + list.map(function (x) {
      return '<div class="bz-tile' + (x.c ? " k-" + x.c : "") + '">' + icon(x.i) + "<span>" + x.t + "</span></div>";
    }).join("") + "</div>" + (cap ? "<figcaption>" + cap + "</figcaption>" : "") + "</figure>";
  }

  /* Photographs, each with where it came from. They are the textbook's
     (OpenStax, Introduction to Business 2e), whose photos carry their own
     open licences; the credit is shown under every one. */
  var PHOTOS = {
    rubicon: { src: "team-rubicon.jpg", w: 650, h: 433,
               alt: "Volunteers in hard hats and safety vests gather around an instructor during outdoor training.",
               credit: "Jamie Mobley, Bureau of Land Management Oregon / Flickr, CC BY 2.0" },
    relief: { src: "relief-supplies.jpg", w: 1200, h: 797,
              alt: "Members of the National Guard unload relief supplies from a cargo pallet on an airfield.",
              credit: "Hawaii and Kentucky National Guard / Flickr, CC BY 2.0" },
    mccafe: { src: "mccafe-beijing.jpg", w: 1200, h: 800,
              alt: "A McCafé in China, built into a traditional red and green storefront with a curved roof.",
              credit: "Marku Kudjerski / Flickr, CC BY 2.0" },
    nespresso: { src: "nespresso.jpg", w: 1200, h: 800,
                 alt: "Tall glowing towers of coffee capsules on display in a Nespresso store.",
                 credit: "Kārlis Dambrāns / Flickr, CC BY 2.0" },
    fed: { src: "fed-chair.jpg", w: 650, h: 365,
           alt: "The chair of the Federal Reserve speaks at a podium in front of American flags.",
           credit: "Federal Reserve / Flickr, public domain" },
    note7: { src: "galaxy-note7.jpg", w: 1200, h: 890,
             alt: "A store display advertising the Samsung Galaxy Note 7 phone.",
             credit: "Paul Sullivan / Flickr, CC BY-ND 2.0" },
    solar: { src: "solar-roofs.jpg", w: 1200, h: 493,
             alt: "Rooftops covered with solar panels, seen from above, beside a winding road.",
             credit: "Marco Verch / Flickr, CC BY 2.0" },
    // Unit 2
    monopoly: { dir: "media/biz/u02/", src: "monopoly.jpg", w: 1200, h: 767,
                alt: "A Monopoly board game box from Hasbro on a store shelf.",
                credit: "Ben Tsai / Flickr, public domain" },
    social: { dir: "media/biz/u02/", src: "social-phone.jpg", w: 1200, h: 960,
              alt: "A hand holding a smartphone whose screen is full of social media app icons.",
              credit: "Mike MacKenzie / Flickr, CC BY 2.0" },
    ev: { dir: "media/biz/u02/", src: "electric-truck.jpg", w: 650, h: 289,
          alt: "A green all-electric pickup truck parked beside a charging station.",
          credit: "Ajay Suresh / Flickr, CC BY 2.0" }
  };
  var PHOTO_DIR = "media/biz/u01/";
  /* photo("rubicon", "Team Rubicon trains volunteers for disaster relief.") → a <figure> for `art`. */
  function photo(key, caption, o) {
    var p = PHOTOS[key];
    if (!p) return "";
    o = o || {};
    return '<figure class="bz-photo' + (o.tall ? " tall" : "") + '"><img src="' + (p.dir || PHOTO_DIR) + p.src + '" alt="' + esc(o.alt || p.alt) +
      '" width="' + p.w + '" height="' + p.h + '" loading="lazy" decoding="async">' +
      "<figcaption>" + (caption ? "<span>" + caption + "</span>" : "") + "<small>Photo: " + esc(p.credit) + "</small></figcaption></figure>";
  }

  /* ------------------------------------------------------------ Random bits
     For generators: n different things from a list, in a random order. */
  function sample(R, arr, n) { return R.shuffle(arr.slice()).slice(0, n); }

  Object.assign(B, {
    S: S, svgRoot: svgRoot, svgPt: svgPt, clamp: clamp, snapTo: snapTo, draggable: draggable, slider: slider, note: note,
    money: money, usd: usd, count: count, pct: pct, round: round, commas: commas,
    css: css, reduced: reduced, tween: tween, chart: chart, readout: readout, kpis: kpis, seg: seg, btn: btn,
    icon: icon, iconAt: iconAt, card: card, tiles: tiles, photo: photo, sample: sample, ICONS: ICONS, PHOTOS: PHOTOS
  });
  // For unit files: L.B, and the ones used most, directly.
  LAB.B = B;
  LAB.icon = icon; LAB.card = card; LAB.tiles = tiles; LAB.photo = photo; LAB.usd = usd;

  css([
    ".bz { gap: 14px; }",
    ".bz .lw-svg text { font-family: var(--text); }",
    ".bz-stage { position: relative; border-radius: 18px; background: var(--lw-surface); padding: 10px 12px; }",
    ".bz-chart { max-height: 380px; }",
    ".bz-tick { font-size: 12px; fill: var(--ink-2); font-variant-numeric: tabular-nums; }",
    ".bz-alabel { font-size: 13px; fill: var(--ink-2); font-weight: 600; letter-spacing: .01em; }",
    ".bz-axis { stroke: var(--lw-axis); stroke-width: 1.5; }",
    ".bz-grid { stroke: var(--lw-grid); stroke-width: 1; }",
    ".bz-read { font-size: 16px; line-height: 1.45; color: var(--ink); text-align: center; min-height: 24px; }",
    ".bz-read b { font-weight: 650; }",
    ".bz-read .up, .bz .good { color: var(--lw-green); } .bz-read .dn, .bz .bad { color: var(--lw-red); }",
    ".bz-kpis { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }",
    ".bz-kpi { min-width: 118px; padding: 10px 16px; border-radius: 14px; background: var(--lw-surface); text-align: center; }",
    ".bz-kpi small { display: block; font-size: 12.5px; color: var(--ink-2); margin-bottom: 2px; }",
    ".bz-kpi b { font-size: 22px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--ink); }",
    ".bz-kpi.good b { color: var(--lw-green); } .bz-kpi.bad b { color: var(--lw-red); }",
    ".bz-seg { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; border-radius: 13px; background: var(--lw-surface); }",
    ".bz-segb { border: 0; background: transparent; color: var(--ink-2); font: inherit; font-size: 14.5px; padding: 7px 14px; border-radius: 10px; cursor: pointer; }",
    ".bz-segb:hover { color: var(--ink); }",
    ".bz-segb.on { background: var(--paper); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.12); font-weight: 600; }",
    "html[data-look=\"obsidian\"] .bz-segb.on { background: rgba(255,255,255,.1); }",
    ".bz-ic { width: 1.25em; height: 1.25em; flex: none; vertical-align: -.25em; }",
    ".bz-card { display: inline-flex; align-items: center; gap: 9px; text-align: left; }",
    ".bz-card .bz-ic { width: 22px; height: 22px; color: var(--lw-blue); }",
    ".bz-tiles { margin: 4px 0 0; }",
    ".bz-trow { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }",
    ".bz-tile { display: grid; justify-items: center; gap: 6px; min-width: 96px; padding: 14px 12px 10px; border-radius: 16px; background: var(--lw-surface, var(--canvas)); color: var(--lw-blue); }",
    ".bz-tile .bz-ic { width: 34px; height: 34px; }",
    ".bz-tile span { font-size: 13.5px; color: var(--ink); text-align: center; max-width: 120px; line-height: 1.3; }",
    ".bz-tiles figcaption, .bz-photo figcaption { margin-top: 8px; font-size: 14px; color: var(--ink-2); display: grid; gap: 3px; text-align: center; }",
    ".bz-photo { margin: 0; }",
    ".bz-photo img { display: block; width: 100%; height: auto; max-height: 280px; object-fit: cover; border-radius: 16px; background: var(--lw-surface, var(--canvas)); }",
    ".bz-photo.tall img { max-height: 380px; }",
    ".bz-photo figcaption small { font-size: 11.5px; color: var(--ink-2); opacity: .75; }",
    ".k-blue { color: var(--lw-blue); } .k-red { color: var(--lw-red); } .k-green { color: var(--lw-green); }",
    ".k-yellow { color: var(--lw-yellow); } .k-orange { color: var(--lw-orange); } .k-purple { color: var(--lw-purple); } .k-muted { color: var(--ink-2); }",
    ".bz .f-blue { fill: var(--lw-blue); } .bz .f-red { fill: var(--lw-red); } .bz .f-green { fill: var(--lw-green); }",
    ".bz .f-yellow { fill: var(--lw-yellow); } .bz .f-orange { fill: var(--lw-orange); } .bz .f-purple { fill: var(--lw-purple); }",
    ".bz .f-ink { fill: var(--ink); } .bz .f-muted { fill: var(--ink-2); } .bz .f-surface { fill: var(--lw-surface); } .bz .f-tile { fill: var(--lw-tile); }",
    ".bz .s-blue { stroke: var(--lw-blue); } .bz .s-red { stroke: var(--lw-red); } .bz .s-green { stroke: var(--lw-green); }",
    ".bz .s-yellow { stroke: var(--lw-yellow); } .bz .s-orange { stroke: var(--lw-orange); } .bz .s-purple { stroke: var(--lw-purple); }",
    ".bz .s-ink { stroke: var(--ink); } .bz .s-muted { stroke: var(--ink-2); }",
    ".bz-lbl { font-size: 13px; fill: var(--ink); font-weight: 600; }",
    ".bz-lbl.sm { font-size: 11.5px; font-weight: 500; fill: var(--ink-2); }",
    ".bz .lw-slider { grid-template-columns: 180px 1fr 84px; }",
    "@media (max-width: 560px) { .bz .lw-slider { grid-template-columns: 1fr 70px; } .bz .lw-slider .lw-sl-name { grid-column: 1 / -1; } }",
    ".bz-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }"
  ].join("\n"));

  /* ================================================================ Studio
     The course's own look, on every card of a Business lesson, quiz and
     practice sitting — everything under [data-course="biz"], so no other lab
     course changes. A card takes an accent from what kind of step it is (a
     guess is gold, a new concept violet, something to try cyan, a warning
     pink …): the kicker says it with an icon and a pill, the card's edge
     and glow carry it, and the words that matter in a prompt are marked in
     it like a highlighter. Answers are big lettered tiles; a right one
     lights up, a wrong one shakes.

     B.kick("Guess first") → the kicker as a pill with its icon; the unit
     runs every lesson kicker through it. Unknown kickers get the blue one. */
  var KICK = {
    "guess first": ["gold", "target"], "look": ["blue", "eye"], "watch": ["blue", "eye"],
    "try it": ["cyan", "hand"], "your turn": ["cyan", "pencil"], "one step harder": ["orange", "bolt"],
    "new word": ["violet", "spark"], "new words": ["violet", "spark"], "new concept": ["violet", "spark"],
    "concept": ["violet", "spark"], "concepts": ["violet", "spark"], "grab it": ["violet", "spark"],
    "careful": ["pink", "alert"], "myth buster": ["pink", "hammer"], "real world": ["lime", "globe"],
    "remember?": ["orange", "rewind"], "put it together": ["gold", "puzzle"], "in your own words": ["violet", "quote"],
    "why it works": ["blue", "bulb"], "lesson": ["violet", "spark"], "your deck": ["gold", "cards"]
  };
  var KICK_IC = {
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V13"/><path d="M17 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.8 15a1.6 1.6 0 0 1 2.4-2.1L8 14.5"/>',
    pencil: '<path d="M4 20h4L19.5 8.5a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    bolt: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 8.5 13.2 11 15.5 12l-2.3 1-1.2 2.5-1.2-2.5L8.5 12l2.3-1z"/><path d="m5.6 5.6 1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
    alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/>',
    hammer: '<path d="M14 6.5 4 16.5a2.1 2.1 0 0 0 3 3l10-10"/><path d="m12.5 5 4-2.5 5 5-2.5 4z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/>',
    rewind: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 3.5V9H9"/><path d="M12 8v4.5l3 1.8"/>',
    puzzle: '<path d="M9 4h4v2a1.8 1.8 0 1 0 3.6 0V4H20v5h-2a1.8 1.8 0 1 0 0 3.6h2V20h-5v-2a1.8 1.8 0 1 0-3.6 0v2H4v-5h2a1.8 1.8 0 1 0 0-3.6H4V4z"/>',
    quote: '<path d="M5 17c0-4 1-7 5-9M14 17c0-4 1-7 5-9"/><path d="M5 17a2.5 2.5 0 1 0 0-.1M14 17a2.5 2.5 0 1 0 0-.1"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    cards: '<rect x="3" y="6" width="11" height="15" rx="2"/><path d="M8 4.5 9 3h10a2 2 0 0 1 2 2v12.5a2 2 0 0 1-1.5 1.9"/>'
  };
  function kick(text) {
    var t = String(text == null ? "" : text);
    if (/class="bzk/.test(t)) return t;
    var k = KICK[t.replace(/<[^>]+>/g, "").trim().toLowerCase()] || ["blue", "spark"];
    return '<span class="bzk bzk-' + k[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"' +
      ' stroke-linecap="round" stroke-linejoin="round">' + KICK_IC[k[1]] + "</svg><span>" + t + "</span></span>";
  }
  B.kick = kick;

  /* A burst of sparks from a point, for a moment worth marking: a right
     answer, a concept grabbed, a myth busted. Drawn over the page, gone in
     under a second, nothing at all with reduced motion. */
  function burst(x, y, o) {
    o = o || {};
    if (reduced() || document.hidden) return;
    var layer = el("div", "bzx-burst");
    layer.style.left = x + "px"; layer.style.top = y + "px";
    document.body.appendChild(layer);
    var n = o.n || 18, tones = o.tones || ["gold", "violet", "cyan", "pink", "lime"];
    for (var i = 0; i < n; i++) {
      var d = el("i", "t-" + tones[i % tones.length] + (i % 3 === 0 ? " sq" : ""));
      var a = (i / n) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1), r = (o.r || 70) * (0.6 + ((i * 37) % 10) / 20);
      layer.appendChild(d);
      if (d.animate) d.animate([
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: "translate(calc(-50% + " + (Math.cos(a) * r).toFixed(1) + "px), calc(-50% + " + (Math.sin(a) * r).toFixed(1) + "px)) scale(.2) rotate(" + (i * 40) + "deg)", opacity: 0 }
      ], { duration: 620 + (i % 4) * 90, easing: "cubic-bezier(.15,.7,.3,1)", fill: "forwards" });
    }
    setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 1100);
  }
  B.burst = burst;
  // A right answer in a Business card bursts from its Check button.
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-course="biz"] .ch-foot .ch-btn.primary');
    if (!b) return;
    var card = b.closest(".ch-card");
    setTimeout(function () {
      var ok = card && card.querySelector(".ch-sheet.on.ok");
      if (!ok || ok.__bzx) return;
      ok.__bzx = true;
      var r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, { n: 16, r: 60 });
    }, 30);
  }, true);

  var BIZ = '[data-course="biz"]';
  // Led by `html` and weighted by a second attribute, so these win over the
  // student side's Obsidian rules (html[data-look="obsidian"] :is(…)) without
  // !important.
  function under(sel) { return sel.split(",").map(function (s) { return "html " + BIZ + "[data-course] " + s.trim(); }).join(", "); }
  B.css([
    // The course's colours. Deeper on the light console, bright on Obsidian.
    BIZ + " { --bx-gold: #b7791f; --bx-violet: #6d4dff; --bx-cyan: #0e8fb0; --bx-pink: #db2767; --bx-lime: #15984a; --bx-orange: #dd5a12; --bx-blue: #2f63f0;",
    "  --bx-go1: #3b5bff; --bx-go2: #7a3dff; }",
    "html[data-look=\"obsidian\"] " + BIZ + " { --bx-gold: #ffc94d; --bx-violet: #a08bff; --bx-cyan: #3ddcf5; --bx-pink: #ff6b9a; --bx-lime: #4ae68a; --bx-orange: #ff9a4d; --bx-blue: #6f9bff; }",
    under(".ch-card") + " { --acc: var(--bx-blue); }",
    under(".ch-card:has(.bzk-gold)") + " { --acc: var(--bx-gold); }",
    under(".ch-card:has(.bzk-violet)") + " { --acc: var(--bx-violet); }",
    under(".ch-card:has(.bzk-cyan)") + " { --acc: var(--bx-cyan); }",
    under(".ch-card:has(.bzk-pink)") + " { --acc: var(--bx-pink); }",
    under(".ch-card:has(.bzk-lime)") + " { --acc: var(--bx-lime); }",
    under(".ch-card:has(.bzk-orange)") + " { --acc: var(--bx-orange); }",

    // The card: an accent edge along the top, a glow in its corner.
    under(".ch-card") + " { border-radius: 28px; isolation: isolate;",
    "  background: radial-gradient(90% 55% at 0% 0%, color-mix(in srgb, var(--acc) 9%, transparent), transparent 70%), var(--paper);",
    "  box-shadow: 0 0 0 1px color-mix(in srgb, var(--acc) 18%, var(--hair)), 0 1px 2px rgba(0,0,0,.05), 0 28px 70px -34px color-mix(in srgb, var(--acc) 40%, transparent); }",
    "html[data-look=\"obsidian\"] " + BIZ + " .ch-card { background: radial-gradient(90% 55% at 0% 0%, color-mix(in srgb, var(--acc) 15%, transparent), transparent 70%), radial-gradient(70% 50% at 100% 100%, color-mix(in srgb, var(--acc) 6%, transparent), transparent 70%), var(--paper);",
    "  box-shadow: 0 0 0 1px color-mix(in srgb, var(--acc) 26%, var(--hair)), 0 30px 80px -30px color-mix(in srgb, var(--acc) 45%, transparent); }",
    under(".ch-card::before") + " { content: \"\"; position: absolute; left: 28px; right: 28px; top: 0; height: 2px; border-radius: 2px; z-index: -1;",
    "  background: linear-gradient(90deg, transparent, var(--acc) 30%, color-mix(in srgb, var(--acc) 50%, var(--bx-pink)) 70%, transparent); opacity: .9; }",
    under(".ch-card.in") + " { animation: bzx-in .55s cubic-bezier(.2,.8,.2,1); }",
    "@keyframes bzx-in { from { opacity: 0; transform: translateY(16px) scale(.985); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }",

    // The kicker: a pill in the card's colour, with its picture.
    ".bzk { display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px 5px 9px; border-radius: 99px; font-size: 11.5px; font-weight: 750;",
    "  letter-spacing: .08em; text-transform: uppercase; color: var(--acc, var(--bx-blue)); background: color-mix(in srgb, var(--acc, var(--bx-blue)) 14%, transparent);",
    "  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--acc, var(--bx-blue)) 26%, transparent); }",
    ".bzk svg { width: 15px; height: 15px; flex: none; }",
    under(".ch-kind") + " { margin-bottom: 16px; }",
    under(".ch-kind > .bzk + span") + " { margin-left: 6px; }",

    // The prompt: bigger, tighter, and the words that matter marked.
    under(".ch-prompt") + " { font-size: 23px; line-height: 1.34; font-weight: 600; letter-spacing: -.02em; }",
    under(".ch-prompt b") + " { font-weight: 750; background: linear-gradient(180deg, transparent 58%, color-mix(in srgb, var(--acc) 34%, transparent) 58%, color-mix(in srgb, var(--acc) 34%, transparent) 92%, transparent 92%); padding: 0 .1em; margin: 0 -.05em; border-radius: 2px; }",
    under(".ch-then b, .ch-after b") + " { color: var(--acc); font-weight: 700; }",
    under(".ch-then") + " { margin-top: 18px; padding: 14px 18px; border-radius: 16px; background: color-mix(in srgb, var(--acc) 10%, transparent); box-shadow: inset 3px 0 0 var(--acc); font-size: 16.5px; line-height: 1.5; }",
    under(".ch-after") + " { margin-top: 16px; font-size: 16.5px; line-height: 1.5; color: var(--ink-2); }",

    // Answers: big lettered tiles.
    under(".ch-options") + " { gap: 10px; counter-reset: bzopt; }",
    under(".ch-opt") + " { counter-increment: bzopt; padding: 15px 18px 15px 14px; border-radius: 16px; font-size: 16.5px; font-weight: 500;",
    "  box-shadow: inset 0 0 0 1.5px var(--hair), 0 1px 0 var(--hair); transition: box-shadow .18s, background .18s, transform .18s cubic-bezier(.2,.8,.2,1); }",
    under(".ch-opt:hover:not(:disabled)") + " { transform: translateY(-2px); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--acc) 55%, transparent), 0 10px 24px -14px color-mix(in srgb, var(--acc) 70%, transparent); }",
    under(".ch-opt .ch-mark") + " { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; box-shadow: inset 0 0 0 1.5px var(--rule); background: transparent; }",
    under(".ch-opt .ch-mark::after") + " { content: counter(bzopt, upper-alpha); font-size: 13px; font-weight: 750; color: var(--ink-2); }",
    under(".ch-opt.on") + " { background: color-mix(in srgb, var(--acc) 10%, var(--paper)); box-shadow: inset 0 0 0 2px var(--acc), 0 10px 26px -14px color-mix(in srgb, var(--acc) 80%, transparent); }",
    under(".ch-opt.on .ch-mark") + " { background: var(--acc); box-shadow: none; }",
    under(".ch-opt.on .ch-mark::after") + " { color: #fff; }",
    "html[data-look=\"obsidian\"] " + BIZ + " .ch-opt.on .ch-mark::after { color: #111; }",
    under(".ch-opt.yes") + " { animation: bzx-pop .45s cubic-bezier(.2,.9,.3,1.4); box-shadow: inset 0 0 0 2px var(--green), 0 0 0 5px color-mix(in srgb, var(--green) 16%, transparent), 0 14px 32px -16px var(--green); }",
    under(".ch-opt.yes .ch-mark") + " { background: var(--green); box-shadow: none; }",
    under(".ch-opt.yes .ch-mark::after") + " { content: \"✓\"; color: #fff; font-size: 15px; }",
    under(".ch-opt.no") + " { animation: bzx-shake .42s ease; }",
    under(".ch-opt.no .ch-mark::after") + " { content: \"✕\"; font-size: 13px; }",
    "@keyframes bzx-pop { 0% { transform: scale(1); } 45% { transform: scale(1.025); } 100% { transform: scale(1); } }",
    "@keyframes bzx-shake { 0%,100% { transform: none; } 20% { transform: translateX(-6px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(2px); } }",

    // Buttons: the forward one is a lit gradient pill.
    under(".ch-btn.primary") + " { background: linear-gradient(120deg, var(--bx-go1), var(--bx-go2)); color: #fff; font-weight: 650; min-width: 140px;",
    "  box-shadow: 0 10px 26px -12px color-mix(in srgb, var(--bx-go2) 85%, transparent), inset 0 1px 0 rgba(255,255,255,.22); }",
    under(".ch-btn.primary:hover:not(:disabled)") + " { background: linear-gradient(120deg, #4a68ff, #8a52ff); transform: translateY(-1px); }",
    under(".ch-btn.primary:disabled") + " { opacity: .32; box-shadow: none; }",
    under(".ch-foot") + " { border-top-color: color-mix(in srgb, var(--acc) 16%, var(--hair)); }",

    // The steps along the top: lit segments, the current one glowing.
    under(".ch-sn-dot.cur::before") + " { background: linear-gradient(90deg, var(--bx-go1), var(--bx-cyan)); box-shadow: 0 0 12px color-mix(in srgb, var(--bx-cyan) 70%, transparent); }",
    under(".ch-sn-dot.seen::before") + " { background: color-mix(in srgb, var(--bx-violet) 55%, transparent); }",
    under(".ch-sn-dot.first::before") + " { background: linear-gradient(90deg, var(--green), color-mix(in srgb, var(--green) 60%, var(--bx-cyan))); }",
    under(".ch-sn-dot.helped::before") + " { background: linear-gradient(90deg, var(--bx-gold), var(--bx-orange)); }",
    under(".ch-prog i.cur") + " { background: linear-gradient(90deg, var(--bx-go1), var(--bx-cyan)); }",

    // Replies: a right one glows green, a wrong one warm.
    under(".ch-sheet.on") + " { border-radius: 16px; padding: 16px 20px; }",
    under(".ch-sheet.ok") + " { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--green) 40%, transparent), 0 12px 30px -18px var(--green); }",
    under(".ch-sheet.ok > b:first-child") + " { font-size: 17px; }",
    under(".ch-hintline") + " { border-radius: 14px; box-shadow: inset 3px 0 0 var(--bx-gold); }",

    // Sort, slots and order: cards that lift, bins in the card's colour.
    under(".ch-cardlet") + " { border-radius: 13px; min-height: 44px; }",
    under(".ch-cardlet:hover:not(:disabled)") + " { transform: translateY(-2px); }",
    under(".ch-cardlet.sel") + " { box-shadow: 0 0 0 2px var(--acc), 0 10px 22px -12px var(--acc); background: color-mix(in srgb, var(--acc) 10%, var(--paper)); }",

    // Picture tiles: lit discs that rise in one after another.
    under(".bz-trow") + " { gap: 12px; }",
    under(".bz-tile") + " { position: relative; min-width: 112px; padding: 18px 14px 13px; border-radius: 20px; gap: 9px;",
    "  background: linear-gradient(180deg, color-mix(in srgb, currentColor 12%, var(--lw-surface)), var(--lw-surface) 75%);",
    "  box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 22%, transparent), 0 16px 30px -22px currentColor; transition: transform .25s cubic-bezier(.2,.8,.2,1); }",
    under(".bz-tile:hover") + " { transform: translateY(-4px) rotate(-1deg); }",
    under(".bz-tile .bz-ic") + " { width: 46px; height: 46px; padding: 9px; box-sizing: border-box; border-radius: 50%; background: color-mix(in srgb, currentColor 16%, transparent); box-shadow: 0 0 0 6px color-mix(in srgb, currentColor 6%, transparent); }",
    under(".bz-tile span") + " { font-weight: 600; font-size: 14px; }",
    under(".ch-card.in .bz-tile") + " { animation: bzx-rise .5s cubic-bezier(.2,.8,.2,1) both; }",
    under(".ch-card.in .bz-tile:nth-child(2)") + " { animation-delay: .07s; }",
    under(".ch-card.in .bz-tile:nth-child(3)") + " { animation-delay: .14s; }",
    under(".ch-card.in .bz-tile:nth-child(4)") + " { animation-delay: .21s; }",
    under(".ch-card.in .bz-tile:nth-child(5)") + " { animation-delay: .28s; }",
    "@keyframes bzx-rise { from { opacity: 0; transform: translateY(14px) scale(.94); } to { opacity: 1; transform: none; } }",

    // Photographs: a slow push in as the card arrives.
    under(".bz-photo") + " { position: relative; overflow: hidden; border-radius: 22px; }",
    under(".bz-photo img") + " { border-radius: 22px; max-height: 300px; }",
    under(".ch-card.in .bz-photo img") + " { animation: bzx-push 1.6s cubic-bezier(.2,.7,.2,1) both; }",
    "@keyframes bzx-push { from { transform: scale(1.08); filter: saturate(.6) brightness(.8); } to { transform: none; filter: none; } }",

    // Scenes sit on a surface with a faint edge in the card's colour.
    under(".bz-stage") + " { border-radius: 20px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--acc) 14%, transparent); }",
    under(".bz-kpi") + " { border-radius: 16px; box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 10%, var(--hair)); }",
    under(".bz-kpi b") + " { font-size: 26px; letter-spacing: -.02em; }",

    // The end of a lesson: its mark glows.
    under(".ch-end .ch-endmark svg") + " { filter: drop-shadow(0 0 18px color-mix(in srgb, var(--green) 60%, transparent)); }",

    // The spark layer.
    ".bzx-burst { position: fixed; z-index: 9999; width: 0; height: 0; pointer-events: none; }",
    ".bzx-burst i { position: absolute; left: 0; top: 0; width: 8px; height: 8px; border-radius: 50%; transform: translate(-50%,-50%); }",
    ".bzx-burst i.sq { border-radius: 2px; width: 7px; height: 7px; }",
    ".bzx-burst .t-gold { background: #ffc94d; } .bzx-burst .t-violet { background: #a08bff; } .bzx-burst .t-cyan { background: #3ddcf5; }",
    ".bzx-burst .t-pink { background: #ff6b9a; } .bzx-burst .t-lime { background: #4ae68a; }",
    "@media (prefers-reduced-motion: reduce) { " + under(".ch-card.in, .ch-card.in .bz-tile, .ch-card.in .bz-photo img, .ch-opt.yes, .ch-opt.no") + " { animation: none; } }"
  ].join("\n"));

  /* More pictures for the concept cards, drawn like the rest (24 × 24, a
     line in the colour of the text). */
  Object.assign(B.ICONS, {
    grab: KICK_IC.hand, spark: KICK_IC.spark, cards: KICK_IC.cards, rewind: KICK_IC.rewind, puzzle: KICK_IC.puzzle,
    pencil: KICK_IC.pencil, alert: KICK_IC.alert, hammer2: KICK_IC.hammer, quote: KICK_IC.quote,
    piggy: '<path d="M4 12.5a7 6 0 0 1 12.2-4l2.8-1.3-.6 3.3a5.6 5.6 0 0 1 .9 2c0 2-1 3.6-2.6 4.7V20h-3v-1.6h-3.8V20h-3v-3a6 6 0 0 1-2.9-4.5z"/><circle cx="15.2" cy="11.2" r=".8" fill="currentColor"/><path d="M8.5 8.4h3.2"/>',
    receipt: '<path d="M6 3h12v18l-2.5-1.5L13 21l-2-1.5L9 21l-3-1.5z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    thermo: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v8"/>',
    gauge: '<path d="M4.5 17a8 8 0 1 1 15 0"/><path d="M12 13l4-4"/><circle cx="12" cy="13" r="1.3"/><path d="M7 17h10"/>',
    loop: '<path d="M20 8a8 8 0 0 0-14.5-2"/><path d="M5 2.5V6h3.5"/><path d="M4 16a8 8 0 0 0 14.5 2"/><path d="M19 21.5V18h-3.5"/>',
    wave: '<path d="M2.5 14c2-5 4-7 6-2s4 7 6 2 4-7 7-3"/><path d="M2.5 20h19"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/><path d="M5 19h14"/>',
    handshake: '<path d="M2.5 12 7 7.5l5 1.8 5-1.8 4.5 4.5"/><path d="M7 12.5l3.8 3.8a1.4 1.4 0 0 0 2 0"/><path d="M9.6 15.1l1.9 1.9a1.4 1.4 0 0 0 2 0l3.9-3.9"/><path d="M12 9.3 9.2 12a1.4 1.4 0 0 0 2 2l2.3-2.2"/>',
    link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
    city: '<path d="M3 21h18"/><path d="M5 21V10h5v11M10 21V4h6v17M16 21v-8h4v8"/><path d="M12.5 8h1M12.5 11h1M12.5 14h1M7 13h1M7 16h1"/>',
    zoom: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/><path d="M8 10.5h5M10.5 8v5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6.5 7.5-6.5 0 4.2-3 6.5-7.5 6.5zM12 14.5c0-3.2-2.5-5.5-6.5-5.5 0 3.2 2.5 5.5 6.5 5.5z"/><path d="M7 21h10"/>',
    ballot: '<path d="M4 12h16v8H4z"/><path d="M8 12V4h8v8"/><path d="m10 8 1.5 1.5L14 6.5"/>',
    dial: '<path d="M12 2.5v3"/><circle cx="12" cy="14" r="7"/><path d="M12 14l3.5-3.5"/><path d="M8 18.5h8"/>',
    printer: '<path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/><path d="M10 17.5h4"/>',
    brain: '<path d="M9.5 4A3 3 0 0 0 6.5 7a3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3A2.5 2.5 0 0 0 12 18V6.5A2.5 2.5 0 0 0 9.5 4z"/><path d="M14.5 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3A2.5 2.5 0 0 1 12 18"/><path d="M8.5 10.5h1.5M14 13.5h1.5"/>',
    rocket: '<path d="M12 2.5c3.2 2.2 5 6.3 4 11.5l-2 2h-4l-2-2c-1-5.2.8-9.3 4-11.5z"/><circle cx="12" cy="9.5" r="1.8"/><path d="M8 14l-3 2.5.8 3.5 3.2-2M16 14l3 2.5-.8 3.5-3.2-2"/><path d="M11 19.5 12 22l1-2.5"/>',
    cross: '<path d="M3 5l18 14M3 19 21 5"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>',
    shift: '<path d="M3 19 11 5"/><path d="M11 19 19 5" stroke-dasharray="2.2 2.4"/><path d="M8 13h8.5M14 10.5l2.5 2.5-2.5 2.5"/>',
    stack: '<rect x="3" y="13" width="8" height="7" rx="1"/><rect x="13" y="13" width="8" height="7" rx="1"/><rect x="8" y="4.5" width="8" height="7" rx="1"/>',
    shelf: '<path d="M3 4.5h18M3 12h18M3 19.5h18"/><path d="M5 4.5v15M19 4.5v15"/><rect x="7" y="7.5" width="3" height="4.5" rx=".5"/>',
    crowd: '<circle cx="6" cy="8" r="2.2"/><circle cx="12" cy="6.5" r="2.4"/><circle cx="18" cy="8" r="2.2"/><path d="M2.5 17a3.5 3.5 0 0 1 7 0M8 16a4 4 0 0 1 8 0M14.5 17a3.5 3.5 0 0 1 7 0"/><path d="M2.5 20.5h19"/>',
    seats: '<path d="M4 20V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v11M13 20V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v11"/><path d="M3 14h9M12 14h9"/>',
    diamond: '<path d="M6 3.5h12l3.5 5L12 21 2.5 8.5z"/><path d="M2.5 8.5h19M9 3.5 7.5 8.5 12 21M15 3.5l1.5 5L12 21"/>',
    patent: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><circle cx="12" cy="13" r="3"/><path d="m10.5 15.5-1 3.5 2.5-1.2 2.5 1.2-1-3.5"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6.5L20.5 7"/>',
    wind: '<path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 15h15a3 3 0 1 1-3 3"/><path d="M3 12h7"/>',
    clockback: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3.5 3.5V9H9"/><path d="M12 8v4.5l3 1.8"/>',
    seesaw: '<path d="M3 17 21 11"/><path d="M12 14l-2.5 6h5z"/><circle cx="5.5" cy="12.5" r="2"/><circle cx="18.5" cy="7" r="2"/>',
    fist: '<path d="M7 11V7.5a1.5 1.5 0 0 1 3 0V11M10 10V6.5a1.5 1.5 0 0 1 3 0V10M13 10V7a1.5 1.5 0 0 1 3 0v4"/><path d="M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 14.5V12a1.5 1.5 0 0 1 3 0"/>'
  });

  /* ================================================================= Grab
     //: grab       concept cards to grab into your deck — a term, its picture,
     //:            what it means and an example, as a card you collect
     The moment a lesson names an idea, the idea becomes a card: a
     collectible with a number, a family colour, a picture, one sentence of
     meaning and one example. The student grabs it — drags it down into the
     deck, or presses Grab — and it flies in. Every concept of a unit is a
     card in its deck; the lesson's last step and the unit page show the
     deck filling up.

     The unit registers its concepts once:
       B.deck.add("biz:1", [{ id: "revenue", name: "Revenue", i: "cash",
         fam: "basics", lesson: 1, t: "What it means.", say: "An example." }, …])
     `t` and `say` are lesson text (write \$ for a dollar); `name` is plain.
     A step grabs one to five of them:
       { type: "learn", scene: { type: "grab", ids: ["revenue", "costs"] }, gate: true }
     A concept counts as grabbed once the step that grabs it has been seen
     (its record, which follows the student between devices), or once it was
     grabbed in this visit. B.deck.where(id, stepId) says which step that is;
     the unit does it for every grab step. */
  var FAMS = {
    basics: { name: "Business basics", short: "Basics", tone: "gold" },
    world: { name: "The environment", short: "Environment", tone: "cyan" },
    systems: { name: "Economic systems", short: "Systems", tone: "violet" },
    macro: { name: "The whole economy", short: "Economy", tone: "blue" },
    markets: { name: "Markets", short: "Markets", tone: "pink" },
    compete: { name: "Competition & change", short: "Competition", tone: "lime" }
  };
  var DECK = { by: {}, list: [], step: {}, now: {} };
  function deckAll(unit) { return DECK.list.filter(function (c) { return !unit || c.unit === unit; }); }
  function deckHas(id) {
    if (DECK.now[id]) return true;
    var sid = DECK.step[id];
    if (!sid || typeof CH.result !== "function") return false;
    var r = CH.result(sid);
    return !!(r && (r.seen || r.solved));
  }
  function no2(n) { return (n < 10 ? "0" : "") + n; }
  function famOf(c) { return FAMS[c.fam] || FAMS.basics; }
  /* One card, as HTML. o.back: the meaning side only (the deck's flip);
     o.mini: a small one for a pile or a strip. */
  function cardHTML(c, o) {
    o = o || {};
    var f = famOf(c);
    if (o.mini) return '<span class="bzg-mini tone-' + f.tone + '" title="' + esc(c.name) + '">' + icon(c.i || "spark") + "</span>";
    return '<div class="bzg-card tone-' + f.tone + (o.cls ? " " + o.cls : "") + '" data-id="' + esc(c.id) + '">' +
      '<span class="bzg-foil" aria-hidden="true"></span>' +
      '<span class="bzg-top"><b>No. ' + no2(c.no) + '</b><em><span class="lg">' + esc(f.name) + '</span><span class="sh">' + esc(f.short || f.name) + "</span></em></span>" +
      '<span class="bzg-art" aria-hidden="true"><span class="bzg-ring"></span>' + icon(c.i || "spark") + "</span>" +
      '<span class="bzg-name">' + esc(c.name) + "</span>" +
      '<span class="bzg-t">' + fmt(c.t || "") + "</span>" +
      (c.say ? '<span class="bzg-eg"><i>For example</i>' + fmt(c.say) + "</span>" : "") +
      '<span class="bzg-bot"><span>Unit ' + esc(String(c.unit || "").split(":")[1] || "") + " · Lesson " + esc(c.lesson) + '</span><span class="bzg-logo">OEdu</span></span>' +
      "</div>";
  }
  B.deck = {
    add: function (unit, list) {
      var n = deckAll(unit).length;
      list.forEach(function (c) {
        if (DECK.by[c.id]) return;
        c.unit = unit; c.no = ++n;
        DECK.by[c.id] = c; DECK.list.push(c);
      });
    },
    get: function (id) { return DECK.by[id] || null; },
    all: deckAll,
    lesson: function (unit, k) { return deckAll(unit).filter(function (c) { return c.lesson === k; }); },
    where: function (id, stepId) { DECK.step[id] = stepId; },
    has: deckHas,
    mark: function (id) { DECK.now[id] = true; },
    count: function (unit) { return deckAll(unit).filter(function (c) { return deckHas(c.id); }).length; },
    card: cardHTML,
    fams: FAMS
  };

  var TONES = ["gold", "cyan", "violet", "blue", "pink", "lime"];
  B.css([
    // Tones: each family's colour, bright — the cards are dark in both looks.
    ".tone-gold { --tc: #ffc94d; } .tone-cyan { --tc: #3ddcf5; } .tone-violet { --tc: #a08bff; }",
    ".tone-blue { --tc: #6f9bff; } .tone-pink { --tc: #ff6b9a; } .tone-lime { --tc: #4ae68a; }",
    // The card.
    ".bzg-card { position: relative; box-sizing: border-box; width: 280px; min-height: 384px; padding: 16px 18px 14px; border-radius: 22px;",
    "  display: flex; flex-direction: column; gap: 10px; color: #fff; text-align: left; overflow: hidden; isolation: isolate;",
    "  border: 1.5px solid transparent; font-family: var(--font);",
    "  background: linear-gradient(165deg, color-mix(in srgb, var(--tc) 26%, #101116), #0f1015 48%, color-mix(in srgb, var(--tc) 12%, #0b0c10)) padding-box,",
    "    linear-gradient(140deg, var(--tc), color-mix(in srgb, var(--tc) 20%, transparent) 38%, transparent 55%, color-mix(in srgb, var(--tc) 70%, transparent)) border-box;",
    "  box-shadow: 0 24px 60px -28px color-mix(in srgb, var(--tc) 70%, transparent), 0 2px 6px rgba(0,0,0,.3);",
    "  transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .3s; }",
    ".bzg-foil { position: absolute; inset: 0; z-index: -1; pointer-events: none; mix-blend-mode: screen; opacity: .9;",
    "  background: linear-gradient(115deg, transparent 28%, rgba(255,255,255,.10) 42%, color-mix(in srgb, var(--tc) 30%, transparent) 50%, rgba(61,220,245,.12) 56%, transparent 72%);",
    "  background-size: 260% 260%; background-position: var(--mx, 100%) var(--my, 0%); animation: bzg-sheen 6s ease-in-out infinite alternate; }",
    "@keyframes bzg-sheen { from { background-position: 110% 0%; } to { background-position: -10% 100%; } }",
    ".bzg-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; }",
    ".bzg-top b { font-weight: 800; color: rgba(255,255,255,.9); font-variant-numeric: tabular-nums; }",
    ".bzg-top em { font-style: normal; font-weight: 700; color: var(--tc); text-align: right; }",
    ".bzg-top .sh { display: none; }",
    ".bzg-row.n3 .bzg-top .lg, .bzg-row.n4 .bzg-top .lg, .bzg-row.n5 .bzg-top .lg { display: none; }",
    ".bzg-row.n3 .bzg-top .sh, .bzg-row.n4 .bzg-top .sh, .bzg-row.n5 .bzg-top .sh { display: inline; }",
    ".bzg-art { position: relative; align-self: center; display: grid; place-items: center; width: 96px; height: 96px; margin: 6px 0 2px; border-radius: 50%; color: var(--tc);",
    "  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--tc) 38%, transparent), color-mix(in srgb, var(--tc) 8%, transparent) 62%, transparent 72%); }",
    ".bzg-art .bz-ic { width: 46px; height: 46px; filter: drop-shadow(0 0 10px color-mix(in srgb, var(--tc) 70%, transparent)); }",
    ".bzg-ring { position: absolute; inset: -4px; border-radius: 50%; border: 1.5px dashed color-mix(in srgb, var(--tc) 55%, transparent); animation: bzg-spin 18s linear infinite; }",
    "@keyframes bzg-spin { to { transform: rotate(360deg); } }",
    ".bzg-name { font-size: 25px; font-weight: 800; letter-spacing: -.025em; line-height: 1.08; text-align: center; }",
    ".bzg-t { font-size: 14.5px; line-height: 1.45; color: rgba(255,255,255,.84); text-align: center; }",
    ".bzg-t b, .bzg-eg b { color: #fff; font-weight: 700; }",
    ".bzg-eg { margin-top: auto; padding: 9px 11px; border-radius: 12px; background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.07);",
    "  font-size: 13px; line-height: 1.4; color: rgba(255,255,255,.8); }",
    ".bzg-eg i { display: block; font-style: normal; font-size: 10.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--tc); margin-bottom: 2px; }",
    ".bzg-bot { display: flex; justify-content: space-between; font-size: 10.5px; letter-spacing: .06em; color: rgba(255,255,255,.5); text-transform: uppercase; }",
    ".bzg-logo { font-weight: 800; color: rgba(255,255,255,.7); }",
    ".bzg-mini { display: inline-grid; place-items: center; width: 34px; height: 46px; border-radius: 8px; color: var(--tc); box-sizing: border-box;",
    "  background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 30%, #111), #0f1015); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc) 50%, transparent), 0 6px 14px -8px var(--tc); }",
    ".bzg-mini .bz-ic { width: 18px; height: 18px; }",

    // The scene: the cards, and the deck they go into.
    ".bzg { display: grid; gap: 18px; justify-items: center; }",
    ".bzg-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; }",
    ".bzg-slot { position: relative; display: grid; justify-items: center; gap: 10px; }",
    ".bzg-row.n2 .bzg-card { width: 256px; min-height: 360px; }",
    ".bzg-row.n3 .bzg-card { width: 206px; min-height: 330px; padding: 13px 13px 11px; gap: 8px; }",
    ".bzg-row.n3 .bzg-name { font-size: 20px; }",
    ".bzg-row.n3 .bzg-t { font-size: 13px; }",
    ".bzg-row.n3 .bzg-eg { font-size: 12px; padding: 7px 9px; }",
    ".bzg-row.n3 .bzg-art { width: 74px; height: 74px; }",
    ".bzg-row.n3 .bzg-art .bz-ic { width: 36px; height: 36px; }",
    // Four or five at once: wide, short cards, two to a row.
    ".bzg-row.n4, .bzg-row.n5 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 14px; width: 100%; }",
    ".bzg-row.n5 .bzg-slot:last-child { grid-column: 1 / -1; justify-self: center; width: calc(50% - 7px); }",
    ".bzg-row.n4 .bzg-slot, .bzg-row.n5 .bzg-slot { justify-items: stretch; gap: 8px; grid-template-rows: 1fr auto; }",
    ".bzg-row.n4 .bzg-card, .bzg-row.n5 .bzg-card { width: 100%; min-height: 0; display: grid; grid-template-columns: 62px minmax(0, 1fr);",
    "  grid-template-areas: \"art top\" \"art name\" \"art t\" \"art eg\"; column-gap: 13px; row-gap: 3px; padding: 12px 14px 13px; align-items: start; }",
    ".bzg-row.n4 .bzg-top, .bzg-row.n5 .bzg-top { grid-area: top; }",
    ".bzg-row.n4 .bzg-art, .bzg-row.n5 .bzg-art { grid-area: art; width: 62px; height: 62px; margin: 2px 0 0; align-self: start; }",
    ".bzg-row.n4 .bzg-art .bz-ic, .bzg-row.n5 .bzg-art .bz-ic { width: 30px; height: 30px; }",
    ".bzg-row.n4 .bzg-name, .bzg-row.n5 .bzg-name { grid-area: name; text-align: left; font-size: 18.5px; margin-top: 1px; }",
    ".bzg-row.n4 .bzg-t, .bzg-row.n5 .bzg-t { grid-area: t; text-align: left; font-size: 13px; }",
    ".bzg-row.n4 .bzg-eg, .bzg-row.n5 .bzg-eg { grid-area: eg; margin-top: 5px; font-size: 12px; padding: 6px 9px; }",
    ".bzg-row.n4 .bzg-bot, .bzg-row.n5 .bzg-bot { display: none; }",
    ".bzg-row.n4 .bzg-btn, .bzg-row.n5 .bzg-btn { justify-self: center; height: 34px; }",
    ".bzg-slot .bzg-card { cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; }",
    ".bzg-slot .bzg-card.drag { cursor: grabbing; transition: none; z-index: 5; box-shadow: 0 40px 80px -30px var(--tc), 0 0 0 2px var(--tc); }",
    ".bzg-slot .bzg-card.back { transition: transform .45s cubic-bezier(.2,1.2,.3,1); }",
    ".bzg-in .bzg-card { opacity: .78; filter: saturate(.75); }",
    ".bzg-in .bzg-card::after { content: \"In your deck\"; position: absolute; right: 12px; top: 42%; z-index: 3; padding: 4px 10px; border-radius: 8px; border: 2.5px solid var(--tc);",
    "  color: var(--tc); font-size: 13px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; transform: rotate(-10deg); background: rgba(10,11,15,.72); }",
    ".bzg-row.n3 .bzg-in .bzg-card::after, .bzg-row.n4 .bzg-in .bzg-card::after, .bzg-row.n5 .bzg-in .bzg-card::after { font-size: 10.5px; right: 8px; }",
    ".bzg-btn { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 18px; border-radius: 99px; border: 0; cursor: pointer; font: inherit; font-size: 14px; font-weight: 700;",
    "  color: #111; background: var(--tc); box-shadow: 0 8px 20px -10px var(--tc); transition: transform .15s, opacity .15s; }",
    ".bzg-btn:hover:not(:disabled) { transform: translateY(-1px); }",
    ".bzg-btn:disabled { cursor: default; color: var(--ink-2); background: transparent; box-shadow: inset 0 0 0 1.5px var(--hair); }",
    ".bzg-btn .bz-ic { width: 16px; height: 16px; }",
    ".bzg-row.done-all .bzg-btn:disabled { color: var(--lw-green); }",
    // The deck: a tray with a pile of what's in it.
    ".bzg-tray { position: relative; display: flex; align-items: center; gap: 16px; width: min(100%, 560px); box-sizing: border-box; padding: 14px 18px; border-radius: 20px;",
    "  background: color-mix(in srgb, var(--acc, var(--lw-blue)) 7%, var(--lw-surface)); border: 1.5px dashed color-mix(in srgb, var(--acc, var(--lw-blue)) 45%, transparent);",
    "  transition: transform .2s, background .2s, border-color .2s, box-shadow .2s; }",
    ".bzg-tray.hot { transform: scale(1.03); border-style: solid; border-color: var(--acc, var(--lw-blue)); box-shadow: 0 0 0 6px color-mix(in srgb, var(--acc, var(--lw-blue)) 16%, transparent), 0 18px 40px -20px var(--acc, var(--lw-blue)); }",
    ".bzg-pile { position: relative; flex: none; width: 74px; height: 56px; }",
    ".bzg-pile .bzg-mini { position: absolute; top: 5px; transition: transform .3s; }",
    ".bzg-pile .bzg-mini:nth-child(1) { left: 0; transform: rotate(-12deg); } .bzg-pile .bzg-mini:nth-child(2) { left: 13px; transform: rotate(-4deg); }",
    ".bzg-pile .bzg-mini:nth-child(3) { left: 26px; transform: rotate(4deg); } .bzg-pile .bzg-mini:nth-child(4) { left: 39px; transform: rotate(12deg); }",
    ".bzg-pile.pop { animation: bzg-pop .5s cubic-bezier(.2,.9,.3,1.5); }",
    "@keyframes bzg-pop { 0% { transform: scale(1); } 40% { transform: scale(1.22); } 100% { transform: scale(1); } }",
    ".bzg-pile:empty::before { content: \"\"; position: absolute; left: 18px; top: 4px; width: 34px; height: 46px; border-radius: 8px; border: 1.5px dashed var(--rule); }",
    ".bzg-tt { display: grid; gap: 2px; min-width: 0; }",
    ".bzg-tt b { font-size: 16px; font-weight: 750; color: var(--ink); }",
    ".bzg-tt span { font-size: 13.5px; color: var(--ink-2); }",
    ".bzg-num { margin-left: auto; font-size: 30px; font-weight: 800; letter-spacing: -.03em; font-variant-numeric: tabular-nums; color: var(--ink); }",
    ".bzg-num small { font-size: 15px; font-weight: 600; color: var(--ink-2); }",
    ".bzg-num.tick { animation: bzg-pop .5s cubic-bezier(.2,.9,.3,1.5); color: var(--acc, var(--lw-blue)); }",
    ".bzg-fly { position: fixed; z-index: 9998; pointer-events: none; margin: 0; }",
    "@media (max-width: 560px) { .bzg-card { width: 250px; } .bzg-row.n3 .bzg-card { width: 160px; } .bzg-row.n4, .bzg-row.n5 { grid-template-columns: 1fr; } .bzg-row.n5 .bzg-slot:last-child { width: 100%; } }",
    "@media (prefers-reduced-motion: reduce) { .bzg-foil, .bzg-ring { animation: none; } .bzg-card { transition: none; } }"
  ].join("\n"));

  /* Tilt a card toward the pointer, and move its foil. */
  function tilt(cardEl) {
    if (reduced()) return;
    cardEl.addEventListener("pointermove", function (e) {
      if (cardEl.classList.contains("drag")) return;
      var r = cardEl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      cardEl.style.setProperty("--ry", ((x - 0.5) * 14).toFixed(2) + "deg");
      cardEl.style.setProperty("--rx", ((0.5 - y) * 12).toFixed(2) + "deg");
      cardEl.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      cardEl.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    });
    cardEl.addEventListener("pointerleave", function () {
      ["--rx", "--ry", "--mx", "--my"].forEach(function (p) { cardEl.style.removeProperty(p); });
    });
  }
  B.deck.tilt = tilt;

  CH.addKind("grab", function (spec, seed, mode) {
    var api = {}, unit = spec.unit || "biz:1";
    var cs = (spec.ids || []).map(function (id) { return B.deck.get(id); }).filter(Boolean);
    var box = el("div", "lw bz bzg");
    var row = el("div", "bzg-row n" + Math.max(1, cs.length));
    box.appendChild(row);
    var tray = el("div", "bzg-tray");
    tray.innerHTML = '<span class="bzg-pile"></span><span class="bzg-tt"><b>Your concept deck</b><span></span></span><span class="bzg-num"></span>';
    box.appendChild(tray);
    var pile = tray.querySelector(".bzg-pile"), tt = tray.querySelector(".bzg-tt span"), numEl = tray.querySelector(".bzg-num");
    var read = readout("bzg-read");
    box.appendChild(read);
    var got = {}, slots = [];
    function total() { return deckAll(unit).length; }
    function paintTray(tick) {
      var have = deckAll(unit).filter(function (c) { return deckHas(c.id); });
      pile.innerHTML = have.slice(-4).map(function (c) { return cardHTML(c, { mini: true }); }).join("");
      numEl.innerHTML = have.length + "<small> / " + total() + "</small>";
      tt.textContent = cs.every(function (c) { return got[c.id]; }) ? "Every card here is in your deck." :
        cs.length > 1 ? "Drag each card down here — or press Grab it." : "Drag the card down here — or press Grab it.";
      if (tick && !reduced()) {
        [pile, numEl].forEach(function (x) { x.classList.remove("pop", "tick"); void x.offsetWidth; x.classList.add(x === pile ? "pop" : "tick"); });
      }
    }
    function done() { return cs.every(function (c) { return got[c.id]; }); }
    function paint() {
      var n = cs.filter(function (c) { return got[c.id]; }).length;
      read.innerHTML = done() ? (cs.length > 1 ? "All " + cs.length + " cards are in your deck." : "It's in your deck.") :
        cs.length > 1 ? (n ? n + " of " + cs.length + " grabbed." : "Grab all " + cs.length + " cards.") : "Grab the card to keep it.";
      row.classList.toggle("done-all", done());
      if (api.onChange) api.onChange();
    }
    function setGot(slot, anim) {
      var c = slot.c;
      got[c.id] = true;
      DECK.now[c.id] = true;
      slot.el.classList.add("bzg-in");
      slot.btn.disabled = true;
      slot.btn.innerHTML = icon("check") + "<span>In your deck</span>";
      paintTray(anim);
      paint();
    }
    function grab(slot, from) {
      if (got[slot.c.id]) return;
      var cardEl = slot.card;
      if (reduced() || document.hidden || !cardEl.animate) { setGot(slot, false); return; }
      var a = (from || cardEl).getBoundingClientRect(), b = pile.getBoundingClientRect();
      var fly = cardEl.cloneNode(true);
      fly.classList.remove("drag", "back");
      fly.classList.add("bzg-fly");
      fly.style.cssText = "left:" + a.left + "px;top:" + a.top + "px;width:" + a.width + "px;height:" + a.height + "px;transform:none;";
      document.body.appendChild(fly);
      cardEl.style.visibility = "hidden";
      cardEl.style.transform = "";
      var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      var an = fly.animate([
        { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + (dx * 0.45) + "px," + (dy * 0.35 - 40) + "px) scale(.62) rotate(-6deg)", opacity: 1, offset: 0.45 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(.12) rotate(10deg)", opacity: 0.6 }
      ], { duration: 640, easing: "cubic-bezier(.5,0,.3,1)" });
      var fin = function () {
        if (fly.parentNode) fly.parentNode.removeChild(fly);
        cardEl.style.visibility = "";
        setGot(slot, true);
        var r = pile.getBoundingClientRect();
        B.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 20, r: 70, tones: [famOf(slot.c).tone, "gold", "cyan"] });
      };
      an.onfinish = fin;
      slot.stop = function () { an.cancel(); if (fly.parentNode) fly.parentNode.removeChild(fly); };
    }
    cs.forEach(function (c) {
      var s = el("div", "bzg-slot");
      s.innerHTML = cardHTML(c);
      var cardEl = s.firstChild;
      cardEl.setAttribute("role", "img");
      cardEl.setAttribute("aria-label", c.name + ": " + String(cardEl.querySelector(".bzg-t").textContent));
      var b = button("bzg-btn tone-" + famOf(c).tone, icon("grab") + "<span>Grab it</span>");
      b.setAttribute("aria-label", "Grab " + c.name + " into your deck");
      s.appendChild(b);
      row.appendChild(s);
      var slot = { c: c, el: s, card: cardEl, btn: b };
      slots.push(slot);
      b.addEventListener("click", function () { grab(slot); });
      tilt(cardEl);
      // Drag it into the deck.
      var st = null;
      cardEl.addEventListener("pointerdown", function (e) {
        if (got[c.id] || e.button > 0) return;
        st = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
        try { cardEl.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ }
      });
      cardEl.addEventListener("pointermove", function (e) {
        if (!st) return;
        var dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (!st.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
        st.moved = true;
        cardEl.classList.add("drag");
        cardEl.classList.remove("back");
        cardEl.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + clamp(dx * 0.04, -8, 8) + "deg) scale(1.03)";
        var t = tray.getBoundingClientRect();
        tray.classList.toggle("hot", e.clientX > t.left - 20 && e.clientX < t.right + 20 && e.clientY > t.top - 30 && e.clientY < t.bottom + 20);
      });
      function end(e) {
        if (!st) return;
        var was = st;
        st = null;
        cardEl.classList.remove("drag");
        var hot = tray.classList.contains("hot");
        tray.classList.remove("hot");
        if (!was.moved) { cardEl.style.transform = ""; return; }
        if (hot && e.type === "pointerup") { grab(slot, cardEl); return; }
        cardEl.classList.add("back");
        cardEl.style.transform = "";
      }
      cardEl.addEventListener("pointerup", end);
      cardEl.addEventListener("pointercancel", end);
      // Already in the deck from an earlier visit: it stays readable.
      if (deckHas(c.id)) {
        got[c.id] = true;
        s.classList.add("bzg-in");
        b.disabled = true;
        b.innerHTML = icon("check") + "<span>In your deck</span>";
      }
    });
    paintTray(false);
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? done() : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { slots.forEach(function (s) { if (!got[s.c.id]) setGot(s, false); }); };
    api.destroy = function () { slots.forEach(function (s) { if (s.stop) s.stop(); }); };
    return api;
  });

  /* =============================================================== Opener
     //: opener     a lesson's title card: its number, its name, the mission,
     //:            and the concepts it hands out, orbiting its emblem
     The first thing a lesson shows, like the title of an episode: a huge
     number, the lesson's name rising in word by word, one line saying what
     the student is about to find out, and a medallion — the lesson's
     emblem at the centre, the concepts it teaches circling it. Below, the
     concepts as slots: empty until grabbed, lit once they're in the deck.
       spec: { n: 3, of: 14, name: "The building blocks", say: "The mission.",
               i: "factory", unit: "biz:1", mins: 10, tone: "gold" }
     `say` is lesson text; `name` is plain. The concepts are the unit's
     deck cards for lesson n (B.deck.lesson). */
  B.css([
    ".bzo { position: relative; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); gap: 10px 24px; align-items: center; min-height: 360px; }",
    ".bzo-l { position: relative; z-index: 1; display: grid; gap: 12px; align-content: center; }",
    ".bzo-num { font-size: 124px; line-height: .8; font-weight: 850; letter-spacing: -.07em; margin: 0 0 6px -6px; color: transparent;",
    "  background: linear-gradient(175deg, var(--acc, var(--tc)) 10%, color-mix(in srgb, var(--acc, var(--tc)) 30%, transparent) 70%, transparent 95%); -webkit-background-clip: text; background-clip: text;",
    "  -webkit-text-stroke: 1px color-mix(in srgb, var(--tc) 55%, transparent); font-variant-numeric: tabular-nums; }",
    ".bzo-eye { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 12px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; color: var(--acc, var(--tc)); }",
    ".bzo-eye span + span::before { content: \"·\"; margin-right: 8px; color: var(--ink-3); }",
    ".bzo-eye span:not(:first-child) { color: var(--ink-2); }",
    ".bzo-name { margin: 0; font-size: 42px; line-height: 1.02; font-weight: 800; letter-spacing: -.035em; color: var(--ink); }",
    ".bzo-name .w { display: inline-block; white-space: pre; }",
    ".bzo.go .bzo-name .w { animation: bzo-rise .7s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i) * 70ms + 120ms); }",
    "@keyframes bzo-rise { from { opacity: 0; transform: translateY(28px) rotate(3deg); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }",
    ".bzo-say { margin: 0; font-size: 18px; line-height: 1.5; color: var(--ink-2); max-width: 30em; }",
    ".bzo-say b { color: var(--ink); }",
    ".bzo-grabs { display: grid; gap: 8px; margin-top: 6px; }",
    ".bzo-grabs > small { font-size: 11.5px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }",
    ".bzo-chips { display: flex; flex-wrap: wrap; gap: 7px; }",
    ".bzo-chip { display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px 0 8px; border-radius: 99px; font-size: 13.5px; font-weight: 650; color: var(--ink-2);",
    "  box-shadow: inset 0 0 0 1.5px var(--rule); background: transparent; }",
    ".bzo-chip .bz-ic { width: 17px; height: 17px; color: var(--acc, var(--tc)); opacity: .85; }",
    ".bzo-chip.got { color: #111; background: var(--tc); box-shadow: 0 6px 16px -8px var(--tc); }",
    ".bzo-chip.got .bz-ic { color: #111; opacity: 1; }",
    ".bzo.go .bzo-chip { animation: bzx-rise .5s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i) * 60ms + 500ms); }",
    // The medallion.
    ".bzo-med { position: relative; justify-self: center; width: 300px; height: 300px; }",
    ".bzo-glow { position: absolute; inset: 20px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--tc) 32%, transparent), transparent 68%); filter: blur(6px); animation: bzo-breathe 4.5s ease-in-out infinite; }",
    "@keyframes bzo-breathe { 0%,100% { transform: scale(.94); opacity: .8; } 50% { transform: scale(1.04); opacity: 1; } }",
    ".bzo-ring { position: absolute; left: 50%; top: 50%; border-radius: 50%; border: 1px dashed color-mix(in srgb, var(--tc) 40%, transparent); transform: translate(-50%, -50%); }",
    ".bzo-ring.r1 { width: 190px; height: 190px; animation: bzo-spin 38s linear infinite; }",
    ".bzo-ring.r2 { width: 272px; height: 272px; border-style: solid; border-color: color-mix(in srgb, var(--tc) 16%, transparent); animation: bzo-spin 56s linear infinite reverse; }",
    "@keyframes bzo-spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }",
    ".bzo-sat { position: absolute; left: 50%; top: 50%; width: 0; height: 0; transform: rotate(var(--a)) translateX(var(--r)) rotate(calc(-1 * var(--a))); }",
    ".bzo-sat b { position: absolute; left: -21px; top: -21px; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; color: var(--acc, var(--tc));",
    "  background: color-mix(in srgb, var(--tc) 14%, var(--paper)); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--tc) 45%, transparent), 0 8px 18px -10px var(--tc); }",
    ".bzo-ring.r1 .bzo-sat b { animation: bzo-unspin 38s linear infinite; } .bzo-ring.r2 .bzo-sat b { animation: bzo-unspin 56s linear infinite reverse; }",
    "@keyframes bzo-unspin { to { transform: rotate(-360deg); } }",
    ".bzo-sat b.got { color: #111; background: var(--tc); }",
    ".bzo-sat .bz-ic { width: 21px; height: 21px; }",
    ".bzo-core { position: absolute; left: 50%; top: 50%; width: 118px; height: 118px; margin: -59px 0 0 -59px; border-radius: 50%; display: grid; place-items: center; color: #fff;",
    "  background: radial-gradient(circle at 32% 26%, color-mix(in srgb, var(--tc) 55%, #fff), var(--tc) 42%, color-mix(in srgb, var(--tc) 45%, #000) 100%);",
    "  box-shadow: 0 0 0 8px color-mix(in srgb, var(--tc) 14%, transparent), 0 0 60px color-mix(in srgb, var(--tc) 55%, transparent), inset 0 -8px 20px rgba(0,0,0,.25); animation: bzo-pulse 3.2s ease-in-out infinite; }",
    "@keyframes bzo-pulse { 0%,100% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--tc) 14%, transparent), 0 0 50px color-mix(in srgb, var(--tc) 45%, transparent), inset 0 -8px 20px rgba(0,0,0,.25); }",
    "  50% { box-shadow: 0 0 0 14px color-mix(in srgb, var(--tc) 8%, transparent), 0 0 80px color-mix(in srgb, var(--tc) 60%, transparent), inset 0 -8px 20px rgba(0,0,0,.25); } }",
    ".bzo-core .bz-ic { width: 56px; height: 56px; stroke-width: 1.6; filter: drop-shadow(0 2px 6px rgba(0,0,0,.35)); }",
    ".bzo-dot { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: var(--tc); opacity: .5; animation: bzo-twinkle 2.6s ease-in-out infinite; animation-delay: var(--d); }",
    "@keyframes bzo-twinkle { 0%,100% { opacity: .15; transform: scale(.6); } 50% { opacity: .9; transform: scale(1.4); } }",
    ".bzo.go .bzo-med { animation: bzo-land .9s cubic-bezier(.2,.8,.2,1) both .1s; }",
    "@keyframes bzo-land { from { opacity: 0; transform: scale(.7) rotate(-25deg); } to { opacity: 1; transform: none; } }",
    // The card around an opener: the kicker and the empty prompt step aside.
    under(".ch-card:has(> .ch-work > .bzo) > .ch-kind, .ch-card:has(> .ch-work > .bzo) > .ch-prompt") + " { display: none; }",
    under(".ch-card:has(> .ch-work > .bzo) > .ch-work") + " { margin-top: 0; }",
    under(".ch-card:has(> .ch-work > .bzo)") + " { padding-top: 38px; }",
    TONES.map(function (t) { return under(".ch-card:has(> .ch-work > .bzo.tone-" + t + ")") + " { --acc: var(--bx-" + t + "); }"; }).join("\n"),
    "@media (max-width: 640px) { .bzo { grid-template-columns: 1fr; } .bzo-med { width: 240px; height: 240px; transform: scale(.8); margin: -30px auto; } .bzo-num { font-size: 92px; } .bzo-name { font-size: 32px; } }",
    "@media (prefers-reduced-motion: reduce) { .bzo *, .bzo.go * { animation: none !important; } }"
  ].join("\n"));

  CH.addKind("opener", function (spec, seed, mode) {
    var api = {}, unit = spec.unit || "biz:1", n = spec.n || 1;
    var cs = B.deck.lesson(unit, n);
    var tone = spec.tone || (cs[0] ? FAMS[cs[0].fam] && FAMS[cs[0].fam].tone : "") || "blue";
    var box = el("div", "lw bz bzo tone-" + tone);
    var words = String(spec.name || "").split(/(\s+)/).filter(function (w) { return w.length; });
    var k = 0;
    var l = el("div", "bzo-l");
    l.innerHTML =
      '<div class="bzo-num" aria-hidden="true">' + no2(n) + "</div>" +
      '<div class="bzo-eye"><span>Lesson ' + n + (spec.of ? " of " + spec.of : "") + "</span>" + (spec.mins ? "<span>About " + spec.mins + " min</span>" : "") +
        (cs.length ? "<span>" + cs.length + " concept" + (cs.length === 1 ? "" : "s") + "</span>" : "") + "</div>" +
      '<h2 class="bzo-name">' + words.map(function (w) { return /^\s+$/.test(w) ? w : '<span class="w" style="--i:' + (k++) + '">' + esc(w) + "</span>"; }).join("") + "</h2>" +
      (spec.say ? '<p class="bzo-say">' + spec.say + "</p>" : "") +
      (cs.length ? '<div class="bzo-grabs"><small>Concepts to grab</small><div class="bzo-chips">' + cs.map(function (c, i) {
        return '<span class="bzo-chip' + (deckHas(c.id) ? " got" : "") + '" style="--i:' + i + '">' + icon(c.i || "spark") + esc(c.name) + "</span>";
      }).join("") + "</div></div>" : "");
    box.appendChild(l);
    // The medallion: the emblem, and the concepts circling it on two rings.
    var med = el("div", "bzo-med");
    med.setAttribute("aria-hidden", "true");
    var r1 = [], r2 = [];
    cs.forEach(function (c, i) { (cs.length > 4 && i % 2 ? r2 : r1).push(c); });
    function ring(cls, list, r, off) {
      var h = '<span class="bzo-ring ' + cls + '">';
      list.forEach(function (c, i) {
        var a = off + i * 360 / Math.max(1, list.length);
        h += '<span class="bzo-sat" style="--a:' + a.toFixed(1) + "deg;--r:" + r + 'px"><b class="' + (deckHas(c.id) ? "got" : "") + '">' + icon(c.i || "spark") + "</b></span>";
      });
      return h + "</span>";
    }
    var dots = "";
    for (var d = 0; d < 14; d++) {
      var ang = d * 2.4, rr = 60 + (d * 37) % 90;
      dots += '<i class="bzo-dot" style="left:' + (150 + Math.cos(ang) * rr).toFixed(0) + "px;top:" + (150 + Math.sin(ang) * rr).toFixed(0) + "px;--d:" + (d * 0.19).toFixed(2) + 's"></i>';
    }
    med.innerHTML = '<span class="bzo-glow"></span>' + dots + ring("r1", r1, 95, -90) + ring("r2", r2, 136, -60) +
      '<span class="bzo-core">' + icon(spec.i || "spark") + "</span>";
    box.appendChild(med);
    box.setAttribute("aria-label", "Lesson " + n + ": " + (spec.name || ""));
    // Play the entrance once the card is on the page.
    requestAnimationFrame(function () { box.classList.add("go"); });
    api.el = box;
    api.ready = function () { return true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () {};
    return api;
  });

  /* ================================================================= Myth
     //: myth       a myth buster: a claim most people believe, a vote, the
     //:            clues one at a time, then the claim cracks — BUSTED
     The usual mistake, met head on and broken by the student. A claim sits
     on a card in big type; the student says whether it sounds true. Then the
     clues come one tap at a time, and the last tap busts it: the card
     cracks, a stamp comes down, and the truth takes its place. Whatever the
     vote, the evidence decides.
       spec: { t: "Revenue is the same as profit.",
               rows: [{ i: "cash", say: "A clue." }, …],      // two to four
               caption: "The truth, in a sentence or two.", gate: true }
     `t`, `say` and `caption` are lesson text (write \$ for a dollar). */
  B.css([
    ".bzm { display: grid; gap: 16px; }",
    ".bzm-claim { position: relative; overflow: hidden; padding: 30px 30px 26px; border-radius: 22px; text-align: center; isolation: isolate;",
    "  background: radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--acc, var(--bx-pink)) 20%, transparent), transparent 70%), var(--lw-surface);",
    "  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--acc, var(--bx-pink)) 35%, transparent); transition: filter .4s; }",
    ".bzm-claim::before { content: \"\\201C\"; position: absolute; left: 16px; top: -24px; font-size: 150px; line-height: 1; font-family: Georgia, serif; color: var(--acc, var(--bx-pink)); opacity: .18; z-index: -1; }",
    ".bzm-tag { display: inline-block; padding: 4px 11px; border-radius: 99px; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;",
    "  color: var(--acc, var(--bx-pink)); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--acc, var(--bx-pink)) 50%, transparent); }",
    ".bzm-q { margin: 14px auto 0; max-width: 20em; font-size: 30px; line-height: 1.18; font-weight: 800; letter-spacing: -.03em; color: var(--ink); transition: color .4s, opacity .4s; }",
    ".bzm-q b { color: var(--acc, var(--bx-pink)); }",
    ".bzm-crack { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }",
    ".bzm-crack path { fill: none; stroke: var(--ink); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }",
    ".bzm.busted .bzm-crack path { opacity: .85; animation: bzm-draw .5s cubic-bezier(.3,.7,.2,1) both; animation-delay: var(--d); }",
    "@keyframes bzm-draw { from { stroke-dashoffset: var(--len); } to { stroke-dashoffset: 0; } }",
    ".bzm.busted .bzm-q { color: var(--ink-3); text-decoration: line-through; text-decoration-thickness: 3px; text-decoration-color: var(--acc, var(--bx-pink)); }",
    ".bzm.busted .bzm-claim { animation: bzm-hit .45s ease; }",
    "@keyframes bzm-hit { 0%,100% { transform: none; } 15% { transform: translate(-7px, 2px) rotate(-.6deg); } 35% { transform: translate(6px, -2px) rotate(.5deg); } 55% { transform: translate(-4px, 1px); } 75% { transform: translate(2px, 0); } }",
    ".bzm-stamp { position: absolute; right: 26px; top: 50%; padding: 6px 16px 5px; border-radius: 10px; font-size: 30px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase;",
    "  color: var(--acc, var(--bx-pink)); border: 4px solid currentColor; background: color-mix(in srgb, var(--paper) 70%, transparent); transform: translateY(-50%) rotate(-12deg) scale(2.4); opacity: 0; pointer-events: none; }",
    ".bzm.busted .bzm-stamp { animation: bzm-stamp .42s cubic-bezier(.3,1.6,.5,1) both .38s; }",
    "@keyframes bzm-stamp { from { opacity: 0; transform: translateY(-50%) rotate(-20deg) scale(2.6); } to { opacity: 1; transform: translateY(-50%) rotate(-12deg) scale(1); } }",
    ".bzm-vote { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }",
    ".bzm-vb { display: inline-flex; align-items: center; gap: 9px; height: 50px; padding: 0 22px; border: 0; border-radius: 16px; cursor: pointer; font: inherit; font-size: 16px; font-weight: 700;",
    "  color: var(--ink); background: var(--lw-surface); box-shadow: inset 0 0 0 1.5px var(--rule); transition: transform .15s, box-shadow .15s, background .15s; }",
    ".bzm-vb:hover:not(:disabled) { transform: translateY(-2px); box-shadow: inset 0 0 0 1.5px var(--acc, var(--bx-pink)); }",
    ".bzm-vb .bz-ic { width: 20px; height: 20px; }",
    ".bzm-vb.on { background: color-mix(in srgb, var(--acc, var(--bx-pink)) 14%, var(--lw-surface)); box-shadow: inset 0 0 0 2px var(--acc, var(--bx-pink)); }",
    ".bzm-vb:disabled:not(.on) { opacity: .4; cursor: default; }",
    ".bzm-react { text-align: center; font-size: 16px; font-weight: 600; color: var(--ink-2); min-height: 0; }",
    ".bzm-react:empty { display: none; }",
    ".bzm-ex { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }",
    ".bzm-ex li { display: grid; grid-template-columns: 46px 1fr; gap: 14px; align-items: center; padding: 12px 16px 12px 12px; border-radius: 16px; background: var(--lw-surface);",
    "  box-shadow: inset 0 0 0 1px var(--hair); animation: bzx-rise .45s cubic-bezier(.2,.8,.2,1) both; }",
    ".bzm-ex .ic { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 14px; color: var(--acc, var(--bx-pink)); background: color-mix(in srgb, var(--acc, var(--bx-pink)) 13%, transparent); }",
    ".bzm-ex .ic .bz-ic { width: 24px; height: 24px; }",
    ".bzm-ex small { display: block; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 2px; }",
    ".bzm-ex span { font-size: 16px; line-height: 1.45; color: var(--ink); }",
    ".bzm-acts { display: flex; justify-content: center; }",
    ".bzm-acts:empty { display: none; }",
    ".bzm-go { display: inline-flex; align-items: center; gap: 9px; height: 46px; padding: 0 22px; border: 0; border-radius: 99px; cursor: pointer; font: inherit; font-size: 15.5px; font-weight: 700;",
    "  color: var(--ink); background: var(--lw-surface); box-shadow: inset 0 0 0 1.5px var(--rule); transition: transform .15s; }",
    ".bzm-go:hover { transform: translateY(-1px); }",
    ".bzm-go.bust { color: #fff; background: linear-gradient(120deg, #ff3d7f, #ff7a45); box-shadow: 0 12px 28px -12px #ff3d7f; }",
    ".bzm-go .bz-ic { width: 19px; height: 19px; }",
    ".bzm-truth { display: none; grid-template-columns: 46px 1fr; gap: 14px; align-items: center; padding: 16px 18px 16px 14px; border-radius: 18px;",
    "  background: color-mix(in srgb, var(--lw-green) 12%, var(--lw-surface)); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--lw-green) 45%, transparent), 0 16px 36px -22px var(--lw-green); }",
    ".bzm.busted .bzm-truth { display: grid; animation: bzx-rise .5s cubic-bezier(.2,.8,.2,1) both .7s; }",
    ".bzm-truth .ic { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; color: #fff; background: var(--lw-green); }",
    ".bzm-truth .ic .bz-ic { width: 24px; height: 24px; stroke-width: 2.4; }",
    ".bzm-truth small { display: block; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--lw-green); margin-bottom: 3px; }",
    ".bzm-truth span { font-size: 17px; line-height: 1.45; font-weight: 600; color: var(--ink); }",
    "@media (max-width: 560px) { .bzm-q { font-size: 23px; } .bzm-stamp { font-size: 22px; right: 12px; } }",
    "@media (prefers-reduced-motion: reduce) { .bzm *, .bzm.busted * { animation: none !important; } .bzm.busted .bzm-crack path { stroke-dashoffset: 0; } .bzm.busted .bzm-stamp { opacity: 1; transform: translateY(-50%) rotate(-12deg); } }"
  ].join("\n"));

  /* Cracks from a point of impact: a few jagged lines, the same every time. */
  function mythCracks(seedStr) {
    var h = 0;
    for (var i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
    function rnd() { h = (h * 1103515245 + 12345) >>> 0; return (h % 1000) / 1000; }
    var cx = 360 + rnd() * 80, cy = 70 + rnd() * 40, out = [];
    for (var k = 0; k < 7; k++) {
      var a = k / 7 * Math.PI * 2 + rnd() * 0.5, x = cx, y = cy, d = "M" + x.toFixed(0) + " " + y.toFixed(0), len = 0;
      var segs = 4 + Math.floor(rnd() * 3);
      for (var s = 0; s < segs; s++) {
        var step = 26 + rnd() * 34, aa = a + (rnd() - 0.5) * 0.9;
        var nx = x + Math.cos(aa) * step, ny = y + Math.sin(aa) * step * 0.7;
        len += Math.hypot(nx - x, ny - y);
        x = nx; y = ny;
        d += " L" + x.toFixed(0) + " " + y.toFixed(0);
      }
      out.push({ d: d, len: Math.ceil(len), delay: (k * 0.04).toFixed(2) });
    }
    return out;
  }

  CH.addKind("myth", function (spec, seed, mode) {
    var api = {}, rows = spec.rows || [], shown = 0, phase = "vote", vote = null;
    var box = el("div", "lw bz bzm");
    var claim = el("div", "bzm-claim");
    claim.innerHTML = '<span class="bzm-tag">Myth or fact?</span><p class="bzm-q">' + (spec.t || "") + "</p>";
    var svgNS = "http://www.w3.org/2000/svg";
    var crack = document.createElementNS(svgNS, "svg");
    crack.setAttribute("class", "bzm-crack");
    crack.setAttribute("viewBox", "0 0 720 180");
    crack.setAttribute("preserveAspectRatio", "none");
    crack.setAttribute("aria-hidden", "true");
    mythCracks(String(seed || "m") + (spec.t || "")).forEach(function (c) {
      var p = document.createElementNS(svgNS, "path");
      p.setAttribute("d", c.d);
      p.setAttribute("stroke-dasharray", c.len);
      p.setAttribute("style", "--len:" + c.len + ";--d:" + c.delay + "s;stroke-dashoffset:" + c.len);
      crack.appendChild(p);
    });
    claim.appendChild(crack);
    claim.appendChild(el("span", "bzm-stamp", "Busted"));
    box.appendChild(claim);
    var voteRow = el("div", "bzm-vote");
    var yes = button("bzm-vb", icon("check") + "<span>Sounds true</span>");
    var no = button("bzm-vb", icon("x") + "<span>It's a myth</span>");
    voteRow.appendChild(yes); voteRow.appendChild(no);
    box.appendChild(voteRow);
    var react = el("div", "bzm-react");
    box.appendChild(react);
    var list = el("ol", "bzm-ex");
    box.appendChild(list);
    var acts = el("div", "bzm-acts");
    box.appendChild(acts);
    var truth = el("div", "bzm-truth", '<span class="ic">' + icon("check") + '</span><div><small>The truth</small><span>' + (spec.caption || "") + "</span></div>");
    box.appendChild(truth);
    var read = readout("bzm-read");
    box.appendChild(read);
    var LET = "ABCDEFG";

    function addRow(i) {
      var r = rows[i];
      var li = el("li", "", '<span class="ic">' + icon(r.i || "eye") + '</span><div><small>Clue ' + LET[i] + "</small><span>" + (r.say || "") + "</span></div>");
      list.appendChild(li);
    }
    function paintActs() {
      acts.innerHTML = "";
      if (phase === "clues") {
        var more = shown < rows.length;
        var b = button("bzm-go" + (more ? "" : " bust"), more ? "<span>Next clue</span>" + icon("arrow") : icon("hammer2") + "<span>Bust the myth</span>");
        b.addEventListener("click", function () {
          if (shown < rows.length) { addRow(shown++); paintActs(); paint(); }
          else bust(true);
        });
        acts.appendChild(b);
        setTimeout(function () { if (b.isConnected && document.activeElement && box.contains(document.activeElement)) b.focus(); }, 0);
      }
    }
    function pick(v) {
      if (phase !== "vote") return;
      vote = v;
      (v ? yes : no).classList.add("on");
      yes.disabled = no.disabled = true;
      react.textContent = v ? "Most people think so. Let's put it to the test." : "Good instinct. Now let's prove it.";
      phase = "clues";
      if (rows.length) addRow(shown++);
      paintActs();
      paint();
    }
    function bust(anim) {
      phase = "done";
      while (shown < rows.length) addRow(shown++);
      acts.innerHTML = "";
      if (!vote && vote !== false) { yes.disabled = no.disabled = true; }
      box.classList.add("busted");
      react.textContent = vote === true ? "It sounded true — and it isn't. That's what makes it a myth." :
        vote === false ? "You called it: a myth." : "";
      if (anim && !reduced()) {
        setTimeout(function () {
          var r = claim.getBoundingClientRect();
          B.burst(r.right - 110, r.top + r.height / 2, { n: 22, r: 90, tones: ["pink", "orange", "gold"] });
        }, 520);
      }
      paint();
    }
    yes.addEventListener("click", function () { pick(true); });
    no.addEventListener("click", function () { pick(false); });
    function paint() {
      read.textContent = phase === "vote" ? "Does this sound true? Vote, then look at the clues." :
        phase === "clues" ? (shown < rows.length ? "Clue " + shown + " of " + rows.length + "." : "That's every clue. Now bust the myth.") :
        "Myth busted.";
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? phase === "done" : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { if (phase !== "done") bust(false); };
    return api;
  });

  /* ================================================================= Flip
     //: flip       cards you turn over one at a time: a picture and a name on
     //:            the front, what it means on the back
     A handful of related ideas met one at a time instead of as a list: each
     card shows a picture and a name, and turning it shows the idea in a
     sentence or two. With gate, Continue waits until every card has been
     turned.
       spec: { cards: [{ i: "tree", name: "Natural resources", t: "…", c: "green" }, …],
               cols: 2 | 3 | 4, gate }
     `t` (the back) is lesson text — the lab formats it before it gets here,
     so write \$ for a dollar; `name` is plain. As a problem it asks for
     nothing and is always ready. */
  B.css([
    ".bz-flips { display: grid; gap: 12px; }",
    ".bz-flip { position: relative; min-height: 132px; border: 0; padding: 0; background: none; cursor: pointer; perspective: 900px; font: inherit; text-align: left; }",
    ".bz-flip-in { position: relative; display: block; height: 100%; min-height: 132px; transition: transform .45s cubic-bezier(.2,.7,.2,1); transform-style: preserve-3d; }",
    ".bz-flip.on .bz-flip-in { transform: rotateY(180deg); }",
    ".bz-flip-f, .bz-flip-b { display: grid; align-content: center; gap: 8px; padding: 14px 16px; border-radius: 18px; min-height: 132px; box-sizing: border-box;",
    "  background: var(--lw-surface); backface-visibility: hidden; -webkit-backface-visibility: hidden; box-shadow: inset 0 0 0 1.5px var(--lw-grid); }",
    ".bz-flip-f { position: absolute; inset: 0; justify-items: center; text-align: center; }",
    ".bz-flip-f .bz-ic { width: 38px; height: 38px; }",
    ".bz-flip-f b { font-size: 16.5px; color: var(--ink); font-weight: 650; }",
    ".bz-flip-f small { font-size: 12px; color: var(--ink-2); }",
    ".bz-flip-b { position: relative; transform: rotateY(180deg); font-size: 15px; line-height: 1.45; color: var(--ink); }",
    ".bz-flips.tight .bz-flip-b { font-size: 13.5px; padding: 12px 12px; }",
    ".bz-flip-b b.nm { font-size: 13px; letter-spacing: .02em; text-transform: uppercase; color: var(--ink-2); font-weight: 650; }",
    ".bz-flip:focus-visible .bz-flip-f, .bz-flip:focus-visible .bz-flip-b { box-shadow: inset 0 0 0 2.5px var(--blue); }",
    ".bz-flip.on .bz-flip-b { box-shadow: inset 0 0 0 1.5px currentColor; }",
    "@media (prefers-reduced-motion: reduce) { .bz-flip-in { transition: none; } }"
  ].join("\n"));
  CH.addKind("flip", function (spec, seed, mode) {
    var api = {}, cards = spec.cards || [], turned = {};
    var box = el("div", "lw bz bz-flipw");
    var grid = el("div", "bz-flips");
    var cols = spec.cols || Math.min(cards.length, cards.length === 4 ? 2 : 3);
    grid.style.gridTemplateColumns = "repeat(" + cols + ", minmax(0, 1fr))";
    if (cols >= 4) grid.classList.add("tight");
    box.appendChild(grid);
    var left = readout("bz-flip-read");
    box.appendChild(left);
    cards.forEach(function (c, k) {
      var b = button("bz-flip k-" + (c.c || "blue"),
        '<span class="bz-flip-in">' +
          '<span class="bz-flip-f">' + icon(c.i || "question") + "<b>" + esc(c.name) + "</b><small>Tap to turn over</small></span>" +
          '<span class="bz-flip-b"><b class="nm">' + esc(c.name) + "</b><span>" + (c.t || "") + "</span></span>" +
        "</span>");
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", c.name + " — turn over");
      b.addEventListener("click", function () {
        var on = !b.classList.contains("on");
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
        if (on) turned[k] = true;
        paint();
      });
      grid.appendChild(b);
    });
    function done() { return cards.every(function (c, k) { return turned[k]; }); }
    function paint() {
      var n = Object.keys(turned).length;
      left.innerHTML = done() ? "You've turned over all " + cards.length + "." :
        n ? n + " of " + cards.length + " turned over." : "";
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? done() : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () {
      [].forEach.call(grid.children, function (b, k) { b.classList.add("on"); b.setAttribute("aria-pressed", "true"); turned[k] = true; });
      paint();
    };
    return api;
  });

  /* ================================================================ Chain
     //: chain      a cause and its effects, one link at a time
     Economics is mostly "this, so that": a change in one place travels. A
     chain shows the first link, and "What happens next?" adds the next one,
     with an arrow and its reason, so the student follows the ripple instead
     of reading a finished list. With gate, Continue waits for the last link.
       spec: { steps: [{ i: "bank", t: "The Fed raises interest rates.", c: "blue" }, …],
               start: 1, next: "What happens next?" }
     Each `t` is lesson text (formatted by the lab: write \$ for a dollar). */
  B.css([
    ".bz-chain { list-style: none; margin: 0; padding: 4px 0; display: grid; gap: 0; }",
    ".bz-link { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: center; padding: 10px 14px; border-radius: 16px; background: var(--lw-surface); }",
    ".bz-link.in { animation: bz-rise .35s cubic-bezier(.2,.7,.2,1) both; }",
    ".bz-link .bz-lk-ic { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 13px; background: color-mix(in srgb, currentColor 13%, transparent); }",
    ".bz-link .bz-ic { width: 24px; height: 24px; }",
    ".bz-link .bz-lk-t { font-size: 16px; line-height: 1.45; color: var(--ink); }",
    ".bz-arrow { display: grid; place-items: center; height: 26px; color: var(--ink-2); }",
    ".bz-arrow svg { width: 16px; height: 16px; }",
    "@keyframes bz-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }",
    "@media (prefers-reduced-motion: reduce) { .bz-link.in { animation: none; } }"
  ].join("\n"));
  CH.addKind("chain", function (spec, seed, mode) {
    var api = {}, steps = spec.steps || [], k = Math.min(steps.length, spec.start || 1);
    var box = el("div", "lw bz bz-chainw");
    var list = el("ol", "bz-chain");
    box.appendChild(list);
    var go = btn(esc(spec.next || "What happens next?"), "bz-chain-next");
    var tools = el("div", "lw-tools");
    tools.appendChild(go);
    box.appendChild(tools);
    var DOWN = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v11M3.5 8.5 8 13l4.5-4.5"/></svg>';
    function add(s, i, fresh) {
      if (i > 0) list.appendChild(el("li", "bz-arrow", DOWN)).setAttribute("aria-hidden", "true");
      var li = el("li", "bz-link k-" + (s.c || "blue") + (fresh && !B.reduced() ? " in" : ""));
      li.innerHTML = '<span class="bz-lk-ic">' + icon(s.i || "arrow") + '</span><span class="bz-lk-t">' + (s.t || "") + "</span>";
      list.appendChild(li);
    }
    steps.slice(0, k).forEach(function (s, i) { add(s, i, false); });
    function paint() {
      tools.hidden = k >= steps.length;
      if (api.onChange) api.onChange();
    }
    go.addEventListener("click", function () {
      if (k >= steps.length) return;
      add(steps[k], k, true);
      k++;
      paint();
      if (k < steps.length) go.focus();
    });
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? k >= steps.length : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { while (k < steps.length) { add(steps[k], k, false); k++; } paint(); };
    return api;
  });

  /* =============================================================== Amount
     //: amount     a number typed the way business writes it: 1,250 · $1,250 ·
     //:            -$40 · 4.5% — commas are thousands, never decimals
     The lab's own number box reads "1,250" as one and a quarter (a decimal
     comma), which is right for maths in some countries and wrong for a price
     tag. Here a comma between groups of three digits is a thousands
     separator, a $ or % typed by habit is ignored, and a loss can be typed
     −40, -40, -$40 or $-40.
       spec: { answer, pre: "\$", post: "%", tol, near: [{ v, fb, tol }], shown,
               label, placeholder }                                            */
  function amountRead(t) {
    t = String(t == null ? "" : t).trim().replace(/[−–]/g, "-").replace(/\s+/g, "");
    if (!t) return NaN;
    var neg = false;
    if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }            // (40) — an accountant's loss
    t = t.replace(/^\+/, "");
    if (/^-/.test(t)) { neg = !neg; t = t.slice(1); }
    t = t.replace(/^\$/, "");
    if (/^-/.test(t)) { neg = !neg; t = t.slice(1); }                     // $-40
    t = t.replace(/%$/, "");
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, "");     // 1,250 or 12,500.75
    if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
    var v = parseFloat(t);
    return neg ? -v : v;
  }
  B.readAmount = amountRead;
  B.css([
    ".bz-amt { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }",
    ".bz-amt .lb-pre, .bz-amt .lb-post { font-size: 24px; color: var(--ink); }",
    ".bz-amt input { min-width: 200px; flex: 0 1 300px; height: 54px; padding: 0 18px; border-radius: 14px; border: 0; outline: 0;",
    "  background: var(--paper); color: var(--ink); font: inherit; font-size: 24px; font-variant-numeric: tabular-nums;",
    "  box-shadow: inset 0 0 0 1.5px var(--rule); transition: box-shadow .15s; }",
    ".bz-amt input:focus { box-shadow: inset 0 0 0 2px var(--blue); }",
    ".bz-amt.no input { box-shadow: inset 0 0 0 2px var(--lw-red); }",
    ".bz-amt.yes input { box-shadow: inset 0 0 0 2px var(--lw-green); }",
    "html[data-look=\"obsidian\"] .bz-amt input { background: rgba(255,255,255,.05); }"
  ].join("\n"));
  CH.addKind("amount", function (s) {
    var api = {};
    var wrap = el("div", "bz bz-amt");
    if (s.pre) wrap.appendChild(el("span", "lb-pre", fmt(s.pre)));
    var inp = el("input");
    inp.type = "text";
    inp.inputMode = "decimal";
    inp.autocomplete = "off";
    inp.spellcheck = false;
    inp.placeholder = s.placeholder || "";
    inp.setAttribute("aria-label", s.label ? String(s.label).replace(/<[^>]+>/g, "") : "Your answer");
    wrap.appendChild(inp);
    if (s.post) wrap.appendChild(el("span", "lb-post", fmt(s.post)));
    inp.addEventListener("input", function () { wrap.classList.remove("no"); if (api.onChange) api.onChange(); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && api.ready() && api.onEnter) api.onEnter(); });
    function shown() {
      if (s.shown != null) return String(s.shown).replace(/<[^>]+>/g, "");
      var a = Math.abs(s.answer), dp = Math.abs(a - Math.round(a)) < 1e-9 ? 0 : (Math.abs(a * 10 - Math.round(a * 10)) < 1e-9 ? 1 : 2);
      return (s.answer < 0 ? "-" : "") + B.commas(a.toFixed(dp).split(".")[0]) + (dp ? "." + a.toFixed(dp).split(".")[1] : "");
    }
    api.el = wrap;
    api.ready = function () { return isFinite(amountRead(inp.value)); };
    api.check = function () {
      var v = amountRead(inp.value);
      var ok = Math.abs(v - s.answer) <= (s.tol || 1e-9);
      wrap.classList.toggle("no", !ok);
      if (ok) { wrap.classList.add("yes"); inp.disabled = true; }
      var near = (s.near || []).filter(function (n) { return Math.abs(v - n.v) <= (n.tol || 1e-9); })[0];
      var say = ok ? null : near ? near.fb :
        (s.answer < 0 && v > 0 && Math.abs(v + s.answer) <= (s.tol || 1e-9)) ? "Right size — but is it a gain or a loss? A loss is written with a minus sign." : null;
      return { ok: ok, say: say };
    };
    api.reveal = function () { inp.value = shown(); inp.disabled = true; wrap.classList.remove("no"); wrap.classList.add("yes"); };
    api.focus = function () { inp.focus(); };
    return api;
  });

  /* ================================================================= Deck
     //: deck       a lesson's last step: the concept cards it handed out,
     //:            face down to recall, and the unit's deck filling up
     The end of a lesson is a recall, not a summary: the cards the lesson
     gave out lie on the table showing only their names; the student says
     what each means, then turns it over to check. Under them, the unit's
     whole deck as a binder — every card a slot, lit once grabbed — so the
     student sees how far they've come and how far there is to go.
       spec: { lesson: 1, unit: "biz:1" }
     B.deck.panel(wrap, unit) puts the same binder on the unit page, and
     B.deck.show(id) opens any grabbed card full size. */
  B.css([
    ".bzd { display: grid; gap: 18px; }",
    ".bzd-table { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; padding: 6px 0 4px; }",
    ".bzd-flip { position: relative; width: 150px; height: 196px; padding: 0; border: 0; background: none; cursor: pointer; perspective: 1000px; font: inherit;",
    "  transform: rotate(var(--rot, 0deg)); transition: transform .3s cubic-bezier(.2,.8,.2,1); }",
    ".bzd-flip:hover { transform: rotate(0deg) translateY(-6px); }",
    ".bzd-in { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform .55s cubic-bezier(.2,.75,.2,1); }",
    ".bzd-flip.on .bzd-in { transform: rotateY(180deg); }",
    ".bzd-f, .bzd-b { position: absolute; inset: 0; box-sizing: border-box; border-radius: 18px; backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden;",
    "  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 14px; color: #fff; text-align: center; border: 1.5px solid transparent;",
    "  background: linear-gradient(165deg, color-mix(in srgb, var(--tc) 26%, #101116), #0f1015 55%, color-mix(in srgb, var(--tc) 12%, #0b0c10)) padding-box,",
    "    linear-gradient(140deg, var(--tc), transparent 45%, color-mix(in srgb, var(--tc) 70%, transparent)) border-box;",
    "  box-shadow: 0 18px 40px -22px color-mix(in srgb, var(--tc) 70%, transparent); }",
    ".bzd-f .no { position: absolute; top: 11px; left: 13px; font-size: 10.5px; font-weight: 800; letter-spacing: .1em; color: rgba(255,255,255,.6); }",
    ".bzd-f .q { position: absolute; top: 9px; right: 12px; font-size: 10.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--tc); }",
    ".bzd-f .art { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 50%; color: var(--tc); background: radial-gradient(circle, color-mix(in srgb, var(--tc) 30%, transparent), transparent 70%); }",
    ".bzd-f .art .bz-ic { width: 30px; height: 30px; }",
    ".bzd-f b { font-size: 16.5px; font-weight: 800; letter-spacing: -.02em; line-height: 1.12; }",
    ".bzd-f small { font-size: 11px; line-height: 1.3; color: rgba(255,255,255,.55); }",
    ".bzd-b { transform: rotateY(180deg); justify-content: flex-start; text-align: left; align-items: stretch; gap: 6px; padding: 13px 12px; }",
    ".bzd-b b { font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--tc); }",
    ".bzd-b span { font-size: 12.5px; line-height: 1.42; color: rgba(255,255,255,.9); }",
    ".bzd-b span b { font-size: inherit; letter-spacing: 0; text-transform: none; color: #fff; }",
    ".bzd-flip:focus-visible { outline: none; } .bzd-flip:focus-visible .bzd-f, .bzd-flip:focus-visible .bzd-b { box-shadow: 0 0 0 3px var(--blue); }",
    ".bzd-card-in .bzd-flip { animation: bzd-deal .6s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i) * 90ms); }",
    "@keyframes bzd-deal { from { opacity: 0; transform: translateY(-40px) rotate(calc(var(--rot, 0deg) - 14deg)) scale(.8); } to { opacity: 1; transform: rotate(var(--rot, 0deg)); } }",
    // The binder: every card of the unit, as a slot.
    ".bzd-bind { display: grid; gap: 12px; padding: 16px 18px 18px; border-radius: 20px; background: var(--lw-surface, var(--canvas)); box-shadow: inset 0 0 0 1px var(--hair); }",
    ".bzd-bh { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }",
    ".bzd-bh b { font-size: 15px; font-weight: 750; color: var(--ink); }",
    ".bzd-bh span { font-size: 13.5px; color: var(--ink-2); }",
    ".bzd-bh em { margin-left: auto; font-style: normal; font-size: 24px; font-weight: 800; letter-spacing: -.03em; color: var(--ink); font-variant-numeric: tabular-nums; }",
    ".bzd-bh em small { font-size: 13px; font-weight: 600; color: var(--ink-2); }",
    ".bzd-bar { position: relative; height: 8px; border-radius: 99px; background: var(--hair); overflow: hidden; }",
    ".bzd-bar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 99px; background: linear-gradient(90deg, #ffc94d, #ff6b9a, #a08bff, #3ddcf5); transition: width .8s cubic-bezier(.2,.8,.2,1); }",
    ".bzd-slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(30px, 1fr)); gap: 6px; }",
    ".bzd-slot { position: relative; height: 40px; border: 0; padding: 0; border-radius: 9px; display: grid; place-items: center; font: inherit; cursor: default;",
    "  color: var(--ink-3); background: transparent; box-shadow: inset 0 0 0 1.5px var(--hair); }",
    ".bzd-slot .bz-ic { width: 16px; height: 16px; opacity: .35; }",
    ".bzd-slot.got { cursor: pointer; color: var(--tc); background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 28%, #111), #0f1015); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc) 55%, transparent), 0 6px 14px -8px var(--tc); }",
    ".bzd-slot.got .bz-ic { opacity: 1; }",
    ".bzd-slot.got:hover { transform: translateY(-2px); }",
    ".bzd-slot.new { animation: bzg-pop .6s cubic-bezier(.2,.9,.3,1.5) both .5s; }",
    ".bzd-slot .n { position: absolute; bottom: 1px; right: 3px; font-size: 8px; font-weight: 800; color: currentColor; opacity: .6; }",
    ".bzd-slot:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }",
    ".bzd-tip { font-size: 13px; color: var(--ink-2); min-height: 18px; }",
    // A card opened full size.
    ".bzd-over { position: fixed; inset: 0; z-index: 9990; display: grid; place-items: center; background: rgba(5,6,10,.62); backdrop-filter: blur(10px) saturate(1.2); -webkit-backdrop-filter: blur(10px);",
    "  animation: bzd-fade .25s ease both; }",
    "@keyframes bzd-fade { from { opacity: 0; } to { opacity: 1; } }",
    ".bzd-over .bzg-card { width: 320px; min-height: 440px; animation: bzd-zoom .45s cubic-bezier(.2,.9,.3,1.25) both; }",
    ".bzd-over .bzg-name { font-size: 29px; }",
    "@keyframes bzd-zoom { from { opacity: 0; transform: scale(.6) rotate(-8deg); } to { opacity: 1; transform: none; } }",
    ".bzd-x { position: absolute; top: 20px; right: 22px; width: 44px; height: 44px; border-radius: 50%; border: 0; cursor: pointer; display: grid; place-items: center; color: #fff; background: rgba(255,255,255,.12); }",
    ".bzd-x .bz-ic { width: 20px; height: 20px; }",
    // On the unit page.
    ".bzd-panel { margin-top: 26px; }",
    ".bzd-panel .bzd-bind { padding: 20px 22px 22px; border-radius: 22px; background: radial-gradient(80% 120% at 0% 0%, rgba(160,139,255,.12), transparent 60%), var(--paper);",
    "  box-shadow: 0 0 0 1px var(--hair), 0 20px 50px -30px rgba(122,61,255,.5); }",
    ".bzd-panel .bzd-slots { grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); }",
    ".bzd-panel .bzd-slot { height: 58px; }",
    ".bzd-panel h2 { display: flex; align-items: center; gap: 10px; }",
    ".bzd-panel h2 .bz-ic { width: 22px; height: 22px; color: #a08bff; }",
    "@media (prefers-reduced-motion: reduce) { .bzd *, .bzd-over, .bzd-over * { animation: none !important; } .bzd-in { transition: none; } }"
  ].join("\n"));

  function deckShow(id) {
    var c = B.deck.get(id);
    if (!c) return;
    var back = document.activeElement;
    var over = el("div", "bzd-over");
    over.setAttribute("role", "dialog");
    over.setAttribute("aria-modal", "true");
    over.setAttribute("aria-label", c.name);
    over.innerHTML = cardHTML(c);
    var x = button("bzd-x", icon("x"));
    x.setAttribute("aria-label", "Close");
    over.appendChild(x);
    document.body.appendChild(over);
    tilt(over.querySelector(".bzg-card"));
    function close() {
      document.removeEventListener("keydown", key, true);
      if (over.parentNode) over.parentNode.removeChild(over);
      if (back && back.focus) back.focus();
    }
    function key(e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } }
    document.addEventListener("keydown", key, true);
    over.addEventListener("click", function (e) { if (e.target === over || e.target.closest(".bzd-x")) close(); });
    x.focus();
  }
  B.deck.show = deckShow;

  /* The binder: every card of a unit, lit once grabbed. fresh: ids to pop. */
  function binder(unit, o) {
    o = o || {};
    var all = deckAll(unit), have = all.filter(function (c) { return deckHas(c.id); });
    var bind = el("div", "bzd-bind");
    var pctDone = all.length ? Math.round(have.length / all.length * 100) : 0;
    bind.innerHTML = '<div class="bzd-bh"><b>' + esc(o.title || "Your concept deck") + "</b><span>" +
      (have.length === all.length && all.length ? "Complete — every concept of the unit." : "Grab them all by finishing the unit's lessons.") +
      "</span><em>" + have.length + "<small> / " + all.length + "</small></em></div>" +
      '<div class="bzd-bar"><i style="width:' + (o.from != null ? o.from : pctDone) + '%"></i></div>';
    var slots = el("div", "bzd-slots");
    var tip = el("div", "bzd-tip");
    all.forEach(function (c) {
      var got = deckHas(c.id), f = famOf(c);
      var s = button("bzd-slot tone-" + f.tone + (got ? " got" : "") + (got && o.fresh && o.fresh.indexOf(c.id) > -1 ? " new" : ""),
        icon(got ? c.i || "spark" : "lock") + '<span class="n">' + c.no + "</span>");
      s.setAttribute("aria-label", got ? c.name + " — open the card" : "Card " + c.no + ", from lesson " + c.lesson + " — not grabbed yet");
      if (!got) s.setAttribute("aria-disabled", "true");
      s.addEventListener("mouseenter", function () { tip.textContent = got ? "No. " + c.no + " · " + c.name : "No. " + c.no + " · locked — it's in lesson " + c.lesson + "."; });
      s.addEventListener("focus", function () { tip.textContent = got ? "No. " + c.no + " · " + c.name : "No. " + c.no + " · locked — it's in lesson " + c.lesson + "."; });
      s.addEventListener("click", function () { if (got) deckShow(c.id); });
      slots.appendChild(s);
    });
    bind.appendChild(slots);
    bind.appendChild(tip);
    tip.textContent = have.length ? "Tap a lit card to open it." : "Your first cards come in lesson 1.";
    if (o.from != null) requestAnimationFrame(function () { requestAnimationFrame(function () { var b = bind.querySelector(".bzd-bar i"); if (b) b.style.width = pctDone + "%"; }); });
    return bind;
  }
  B.deck.binder = binder;

  /* The unit page's panel. The page is drawn again when progress arrives
     from the account, so any old panel goes first. */
  B.deck.panel = function (wrap, unit, me) {
    var old = wrap.querySelector(".bzd-panel");
    if (old) old.parentNode.removeChild(old);
    if (!deckAll(unit).length) return;
    if (me && typeof CH.result === "function") CH.result("", me);
    var sec = el("section", "lb-block bzd-panel lw bz");
    sec.appendChild(el("h2", "lb-h2", icon("cards") + "<span>Concept deck</span>"));
    sec.appendChild(binder(unit));
    var after = wrap.querySelector(".lb-next");
    if (after && after.nextSibling) wrap.insertBefore(sec, after.nextSibling); else wrap.appendChild(sec);
  };

  CH.addKind("deck", function (spec, seed, mode) {
    var api = {}, unit = spec.unit || "biz:1";
    var cs = B.deck.lesson(unit, spec.lesson || 1);
    var box = el("div", "lw bz bzd bzd-card-in");
    var table = el("div", "bzd-table");
    var turned = {};
    var ROT = [-4, 3, -2, 4, -3, 2];
    cs.forEach(function (c, i) {
      var f = famOf(c);
      var b = button("bzd-flip tone-" + f.tone,
        '<span class="bzd-in">' +
          '<span class="bzd-f"><span class="no">No. ' + no2(c.no) + '</span><span class="q">Recall</span><span class="art">' + icon(c.i || "spark") + "</span><b>" + esc(c.name) + "</b><small>What does it mean? Then turn it.</small></span>" +
          '<span class="bzd-b"><b>' + esc(c.name) + "</b><span>" + fmt(c.t || "") + "</span></span>" +
        "</span>");
      b.style.setProperty("--rot", ROT[i % ROT.length] + "deg");
      b.style.setProperty("--i", i);
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", c.name + " — say what it means, then turn it over");
      b.addEventListener("click", function () {
        var on = !b.classList.contains("on");
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
        if (on) turned[c.id] = true;
        paint();
      });
      table.appendChild(b);
    });
    box.appendChild(table);
    var read = readout("bzd-read");
    box.appendChild(read);
    // The unit's binder: this lesson's cards count as grabbed now.
    cs.forEach(function (c) { DECK.now[c.id] = true; });
    var all = deckAll(unit), before = all.filter(function (c) { return deckHas(c.id) && c.lesson !== spec.lesson; }).length;
    box.appendChild(binder(unit, { title: "Unit " + String(unit).split(":")[1] + " deck", fresh: cs.map(function (c) { return c.id; }),
                                   from: all.length ? Math.round(before / all.length * 100) : 0 }));
    function paint() {
      var n = Object.keys(turned).length;
      read.innerHTML = !cs.length ? "" : n === cs.length ? "All " + cs.length + " turned. Any you missed? Those are the ones to practice." :
        n ? n + " of " + cs.length + " turned over." : "Say what each card means out loud — then turn it over to check.";
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () {};
    return api;
  });

  /* =============================================================== Polish
     The course's scenes in its own look: lit slider tracks that fill behind
     the handle, bars and curves that glow in their colour, gauges with a
     lit band, people drawn as avatars, and the pieces rising in one after
     another. Only paint and motion — no scene's layout or behaviour changes
     here, and everything stays under [data-course="biz"] (see Studio). */
  B.css([
    // Sliders: the part of the track behind the handle is lit.
    under(".lw-slider input[type=\"range\"]::-webkit-slider-runnable-track") + " { background: linear-gradient(90deg, var(--bx-go1), var(--acc) var(--p, 0%), color-mix(in srgb, var(--ink) 13%, transparent) var(--p, 0%)); box-shadow: 0 0 14px -4px var(--acc); }",
    under(".lw-slider input[type=\"range\"]::-moz-range-track") + " { background: linear-gradient(90deg, var(--bx-go1), var(--acc) var(--p, 0%), color-mix(in srgb, var(--ink) 13%, transparent) var(--p, 0%)); }",
    under(".lw-slider input[type=\"range\"]::-webkit-slider-thumb") + " { box-shadow: 0 0 0 5px color-mix(in srgb, var(--acc) 28%, transparent), 0 0 20px color-mix(in srgb, var(--acc) 70%, transparent); }",
    under(".lw-slider .lw-sl-val") + " { font-weight: 750; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }",
    // Segmented controls: the chosen one is a lit pill.
    under(".bz-segb.on") + " { background: linear-gradient(120deg, var(--bx-go1), var(--bx-go2)); color: #fff; box-shadow: 0 6px 16px -8px var(--bx-go2); }",
    // Profit: glowing bars and big numbers.
    under(".bz-pf-bars") + " { background: linear-gradient(180deg, color-mix(in srgb, var(--acc) 7%, var(--lw-surface)), var(--lw-surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--acc) 16%, transparent); }",
    under(".bz-pf-track") + " { height: 30px; border-radius: 10px; }",
    under(".bz-pf-seg.rev") + " { background: linear-gradient(90deg, #3b5bff, #6f9bff); box-shadow: 0 0 18px -2px rgba(111,155,255,.75); }",
    under(".bz-pf-seg.var") + " { background: linear-gradient(90deg, #ff4d6d, #ff7a8a); }",
    under(".bz-pf-seg.fix") + " { background: linear-gradient(90deg, #b8324d, #d9475f); opacity: 1; }",
    under(".bz-pf-seg.pro") + " { background: linear-gradient(90deg, #1fb866, #4ae68a); box-shadow: 0 0 18px -2px rgba(74,230,138,.8); }",
    under(".bz-pf-row > b") + " { font-size: 22px; font-weight: 800; letter-spacing: -.02em; }",
    // Market: curves and handles that glow, a pulsing equilibrium.
    under(".bz-mk-d") + " { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--lw-blue) 70%, transparent)); stroke-width: 4; }",
    under(".bz-mk-s") + " { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--lw-orange) 70%, transparent)); stroke-width: 4; }",
    under(".bz-mk-gap") + " { opacity: .8; filter: drop-shadow(0 0 5px currentColor); }",
    under(".bz-mk-knob") + " { filter: drop-shadow(0 0 8px color-mix(in srgb, var(--acc) 80%, transparent)); }",
    under(".bz-mk-e:not(.old)") + " { animation: bzp-glow 1.8s ease-in-out infinite; }",
    "@keyframes bzp-glow { 0%,100% { filter: drop-shadow(0 0 3px var(--lw-green)); } 50% { filter: drop-shadow(0 0 12px var(--lw-green)); } }",
    under(".bz-mk-tab") + " { border-radius: 14px; overflow: hidden; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--acc) 18%, var(--hair)); }",
    // The business cycle: a lit line, a red-tinted recession.
    under(".bz-cy-line") + " { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--lw-blue) 65%, transparent)); stroke-width: 3.5; }",
    under(".bz-cy-rec") + " { opacity: .2; }",
    under(".bz-cy-pt.cur") + " { filter: drop-shadow(0 0 8px var(--lw-blue)); }",
    // Levers: panels on a lit surface, gauges with a glowing band.
    under(".bz-lv-panel") + " { background: linear-gradient(170deg, color-mix(in srgb, var(--acc) 8%, var(--lw-surface)), var(--lw-surface) 60%); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--acc) 16%, transparent); }",
    under(".bz-lv-track") + " { height: 16px; border-radius: 8px; background: color-mix(in srgb, var(--ink) 9%, transparent); }",
    under(".bz-lv-band") + " { opacity: .45; background: linear-gradient(90deg, transparent, var(--lw-green) 20%, var(--lw-green) 80%, transparent); box-shadow: 0 0 14px color-mix(in srgb, var(--lw-green) 50%, transparent); }",
    under(".bz-lv-dot") + " { top: -4px; width: 24px; height: 24px; margin-left: -12px; }",
    under(".bz-lv-g.ok .bz-lv-dot") + " { box-shadow: 0 0 0 3px var(--lw-surface), 0 0 16px var(--lw-green); }",
    under(".bz-lv-g.off .bz-lv-dot") + " { box-shadow: 0 0 0 3px var(--lw-surface), 0 0 16px var(--lw-red); }",
    under(".bz-lv-g b") + " { font-size: 19px; font-weight: 800; }",
    // Labor: people as avatars, boxes lit in their colour.
    under(".bz-lb-p") + " { transition: transform .18s cubic-bezier(.2,.8,.2,1), box-shadow .18s; }",
    under(".bz-lb-p:hover") + " { transform: translateY(-2px); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--acc) 50%, transparent); }",
    under(".bz-lb-p .bz-ic") + " { width: 30px; height: 30px; padding: 5px; box-sizing: border-box; border-radius: 50%; color: var(--acc); background: color-mix(in srgb, var(--acc) 16%, transparent); }",
    under(".bz-lb-p.sel") + " { box-shadow: inset 0 0 0 2px var(--acc), 0 12px 26px -14px var(--acc); transform: translateY(-2px); }",
    under(".bz-lb-bin") + " { box-shadow: inset 0 3px 0 currentColor, inset 0 0 0 1px var(--hair); }",
    under(".bz-lb-bin.emp") + " { color: var(--lw-green); } " + under(".bz-lb-bin.unemp") + " { color: var(--lw-orange); } " + under(".bz-lb-bin.out") + " { color: var(--ink-3); }",
    under(".bz-lb-bin:hover") + " { box-shadow: inset 0 3px 0 currentColor, inset 0 0 0 1.5px currentColor, 0 14px 30px -18px currentColor; }",
    under(".bz-lb-rate b.big") + " { font-size: 30px; font-weight: 850; letter-spacing: -.03em; text-shadow: 0 0 18px color-mix(in srgb, var(--lw-orange) 50%, transparent); }",
    // Keeping customers: glowing columns.
    under(".bz-rt-bar") + " { background: linear-gradient(180deg, #4ae68a, #1a9d57); box-shadow: 0 0 18px -4px rgba(74,230,138,.7); }",
    // A chain of causes: each link lit on its left edge, rising in turn.
    under(".bz-link") + " { box-shadow: inset 3px 0 0 currentColor, inset 0 0 0 1px var(--hair); }",
    under(".bz-link .bz-lk-ic") + " { box-shadow: 0 0 18px -6px currentColor; }",
    // The old flip cards: a lift and a coloured edge.
    under(".bz-flip:hover .bz-flip-f") + " { box-shadow: inset 0 0 0 1.5px currentColor, 0 14px 30px -18px currentColor; }",
    under(".bz-flip-f") + " { background: linear-gradient(170deg, color-mix(in srgb, currentColor 10%, var(--lw-surface)), var(--lw-surface) 70%); }",
    "@media (prefers-reduced-motion: reduce) { " + under(".bz-mk-e:not(.old)") + " { animation: none; } }"
  ].join("\n"));

  /* =============================================================== Profit
     //: profit     run a stand for a day: set the price and how many you sell,
     //:            and watch money in, money out and what is left
     Two sliders (price per item, items sold), a cost per item and a fixed
     cost for the day; three bars — revenue, costs (fixed + per item), and
     what's left, green for a profit and red for a loss — with the day said in
     a sentence.
       spec: { item: "cup", icon: "lemon", title: "Your lemonade stand",
               price: { v, min, max, step }, sold: { v, min, max, step },
               unitCost: 0.5, fixed: 20, fixedName: "stand rental",
               goal: "profit" | "loss" | "even" | { atLeast: 40 },
               answer: { price, sold }, gate }
     With a goal, an idea card holds Continue until it is met; as a problem
     Check tests it and Show me sets `answer`. */
  B.css([
    ".bz-pf-head { display: flex; align-items: center; gap: 10px; font-weight: 650; color: var(--ink); font-size: 16px; }",
    ".bz-pf-head .bz-ic { width: 28px; height: 28px; color: var(--lw-yellow); }",
    ".bz-pf-bars { display: grid; gap: 12px; padding: 16px 18px; border-radius: 18px; background: var(--lw-surface); }",
    ".bz-pf-row { display: grid; grid-template-columns: 150px 1fr 96px; align-items: center; gap: 12px; }",
    ".bz-pf-row > span { font-size: 14.5px; color: var(--ink-2); }",
    ".bz-pf-row > b { font-size: 18px; text-align: right; font-variant-numeric: tabular-nums; color: var(--ink); }",
    ".bz-pf-track { position: relative; height: 26px; border-radius: 8px; background: var(--lw-grid); overflow: hidden; display: flex; }",
    ".bz-pf-seg { height: 100%; transition: width .25s ease; }",
    ".bz-pf-seg.rev { background: var(--lw-blue); }",
    ".bz-pf-seg.fix { background: var(--lw-red); opacity: .6; }",
    ".bz-pf-seg.var { background: var(--lw-red); }",
    ".bz-pf-seg.pro { background: var(--lw-green); }",
    ".bz-pf-seg.los { background: var(--lw-red); background-image: repeating-linear-gradient(45deg, transparent 0 6px, rgba(0,0,0,.18) 6px 12px); }",
    ".bz-pf-row.left b.good { color: var(--lw-green); } .bz-pf-row.left b.bad { color: var(--lw-red); }",
    ".bz-pf-key { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; font-size: 12.5px; color: var(--ink-2); }",
    ".bz-pf-key i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }",
    "@media (max-width: 560px) { .bz-pf-row { grid-template-columns: 1fr 80px; } .bz-pf-row .bz-pf-track { grid-column: 1 / -1; grid-row: 2; } }"
  ].join("\n"));
  CH.addKind("profit", function (spec, seed, mode) {
    var api = {}, moved = false;
    var P = Object.assign({ v: 2, min: 0.5, max: 5, step: 0.5 }, spec.price || {});
    var Q = Object.assign({ v: 40, min: 0, max: 100, step: 5 }, spec.sold || {});
    var uc = spec.unitCost || 0, fx = spec.fixed || 0, item = spec.item || "item";
    var st = { p: P.v, q: Q.v };
    var box = el("div", "lw bz bz-profit");
    if (spec.title !== false) box.appendChild(el("div", "bz-pf-head", icon(spec.icon || "store") + "<span>" + esc(spec.title || "Your stand, for one day") + "</span>"));
    var sl = el("div", "lw-sliders");
    var sp = slider("Price per " + esc(item), { v: P.v, min: P.min, max: P.max, step: P.step, show: function (v) { return usd(v, { dp: P.step % 1 ? 2 : 0 }); } },
      function (v) { st.p = v; moved = true; paint(); });
    var sq = slider(esc(cap(item)) + "s sold", { v: Q.v, min: Q.min, max: Q.max, step: Q.step, show: function (v) { return count(v); } },
      function (v) { st.q = v; moved = true; paint(); });
    sl.appendChild(sp.el); sl.appendChild(sq.el);
    box.appendChild(sl);
    var bars = el("div", "bz-pf-bars");
    function row(label, cls) {
      var r = el("div", "bz-pf-row " + cls);
      r.innerHTML = "<span>" + label + '</span><div class="bz-pf-track"></div><b></b>';
      bars.appendChild(r);
      return r;
    }
    var rRev = row("Money in<br><small>revenue</small>", "in"), rCost = row("Money out<br><small>costs</small>", "out"), rLeft = row("Left over", "left");
    box.appendChild(bars);
    var key = el("div", "bz-pf-key");
    key.innerHTML = (fx ? "<span><i style=\"background:var(--lw-red);opacity:.6\"></i>" + esc(cap(spec.fixedName || "fixed costs")) + " " + esc(money(fx)) + "</span>" : "") +
      (uc ? "<span><i style=\"background:var(--lw-red)\"></i>Supplies " + esc(money(uc, { dp: uc % 1 ? 2 : 0 })) + " per " + esc(item) + "</span>" : "");
    if (fx || uc) box.appendChild(key);
    var read = readout();
    box.appendChild(read);
    function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
    function calc(p, q) { var rev = p * q, cost = fx + uc * q; return { rev: round(rev, 2), cost: round(cost, 2), left: round(rev - cost, 2) }; }
    var scale = Math.max(calc(P.max, Q.max).rev, fx + uc * Q.max, 1);
    function met(s) {
      var g = spec.goal, left = calc(s.p, s.q).left;
      if (!g) return true;
      if (g === "profit") return left > 0;
      if (g === "loss") return left < 0;
      if (g === "even") return Math.abs(left) < 1e-9;
      if (g.atLeast != null) return left >= g.atLeast;
      return true;
    }
    function seg(track, parts) {
      track.innerHTML = "";
      parts.forEach(function (x) { var d = el("i", "bz-pf-seg " + x[0]); d.style.width = Math.max(0, Math.min(100, x[1] / scale * 100)) + "%"; track.appendChild(d); });
    }
    function paint() {
      var c = calc(st.p, st.q);
      seg(rRev.querySelector(".bz-pf-track"), [["rev", c.rev]]);
      seg(rCost.querySelector(".bz-pf-track"), [["fix", fx], ["var", uc * st.q]]);
      seg(rLeft.querySelector(".bz-pf-track"), [[c.left >= 0 ? "pro" : "los", Math.abs(c.left)]]);
      rRev.querySelector("b").textContent = money(c.rev);
      rCost.querySelector("b").textContent = money(c.cost);
      var lb = rLeft.querySelector("b");
      lb.textContent = money(c.left);
      lb.className = c.left > 0 ? "good" : c.left < 0 ? "bad" : "";
      rLeft.querySelector("span").innerHTML = c.left > 0 ? "Profit" : c.left < 0 ? "Loss" : "Left over";
      read.innerHTML = "You sold " + count(st.q) + " at " + esc(money(st.p)) + ": " + esc(money(c.rev)) + " came in and " + esc(money(c.cost)) + " went out. " +
        (c.left > 0 ? '<b class="up">You kept ' + esc(money(c.left)) + " — a profit.</b>" :
         c.left < 0 ? '<b class="dn">You are ' + esc(money(-c.left)) + " short — a loss.</b>" : "<b>You broke even: nothing gained, nothing lost.</b>");
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? (spec.goal ? met(st) : moved) : true) : moved; };
    api.check = function () {
      var ok = met(st), c = calc(st.p, st.q), g = spec.goal;
      var say = ok ? null : g === "loss" ? "You're still making money. Try a lower price, or selling fewer." :
        g === "even" ? "Not quite even — you have " + (c.left > 0 ? "a profit" : "a loss") + " of " + usd(Math.abs(c.left)) + "." :
        "Not enough left over yet (" + usd(c.left) + "). Try a higher price, or selling more.";
      return { ok: ok, say: say };
    };
    api.reveal = function () {
      var a = spec.answer || {};
      if (a.price != null) { st.p = a.price; sp.set(a.price); }
      if (a.sold != null) { st.q = a.sold; sq.set(a.sold); }
      moved = true;
      paint();
    };
    return api;
  });

  /* ================================================================ Stops
     //: stops      a line from one extreme to the other with a few stops on it;
     //:            at each, a card of what is true there (economic systems,
     //:            market structures)
     A slider (or the stop names, tapped) moves along the line; the card
     shows the stop's name, a crowd of icons if it has one, and rows — each a
     plain label, a line of text, and optionally a 0–4 meter. With gate,
     Continue waits until every stop has been visited. As a problem, the
     student moves to the stop that fits (`answer` = its key).
       spec: { left: "The government decides", right: "The market decides",
               stops: [{ key, name, c: "red", icon: "store", crowd: 12,
                         rows: [{ k: "Who owns businesses", t: "…", lvl: 0-4 }],
                         say: "Example: …" }],
               start: 0, gate, answer: "capitalism", fb: { key: "…" } } */
  B.css([
    ".bz-st-ends { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--ink-2); font-weight: 600; }",
    ".bz-st-rail { position: relative; padding: 4px 6px 0; }",
    ".bz-st-rail input[type=range] { width: 100%; accent-color: var(--lw-blue); height: 28px; }",
    ".bz-st-names { display: grid; gap: 6px; margin-top: 4px; }",
    ".bz-st-name { border: 0; background: transparent; font: inherit; font-size: 13.5px; color: var(--ink-2); padding: 6px 4px; border-radius: 9px; cursor: pointer; text-align: center; line-height: 1.25; }",
    ".bz-st-name.on { color: var(--ink); background: var(--lw-surface); font-weight: 650; }",
    ".bz-st-name.seen:not(.on)::after { content: ' ✓'; color: var(--lw-green); }",
    ".bz-st-card { border-radius: 18px; background: var(--lw-surface); padding: 16px 18px; display: grid; gap: 12px; }",
    ".bz-st-title { display: flex; align-items: center; gap: 10px; font-size: 19px; font-weight: 700; color: var(--ink); }",
    ".bz-st-title .bz-ic { width: 28px; height: 28px; }",
    ".bz-st-crowd { display: flex; flex-wrap: wrap; gap: 4px; min-height: 30px; align-items: center; }",
    ".bz-st-crowd .bz-ic { width: 22px; height: 22px; }",
    ".bz-st-crowd.big .bz-ic { width: 40px; height: 40px; }",
    ".bz-st-rows { display: grid; gap: 8px; }",
    ".bz-st-row { display: grid; grid-template-columns: 170px 1fr; gap: 12px; align-items: baseline; font-size: 15px; line-height: 1.4; }",
    ".bz-st-row > span:first-child { color: var(--ink-2); font-size: 13.5px; }",
    ".bz-st-row > span:last-child { color: var(--ink); }",
    ".bz-st-meter { display: inline-flex; gap: 3px; margin-right: 8px; vertical-align: 1px; }",
    ".bz-st-meter i { width: 14px; height: 8px; border-radius: 3px; background: var(--lw-grid); }",
    ".bz-st-meter i.on { background: currentColor; }",
    ".bz-st-ex { font-size: 14px; color: var(--ink-2); border-top: 1px solid var(--lw-grid); padding-top: 10px; }",
    "@media (max-width: 560px) { .bz-st-row { grid-template-columns: 1fr; gap: 2px; } }"
  ].join("\n"));
  CH.addKind("stops", function (spec, seed, mode) {
    var api = {}, stops = spec.stops || [], seen = {}, moved = false;
    var at = Math.max(0, Math.min(stops.length - 1, spec.start || 0));
    var box = el("div", "lw bz bz-stops");
    var ends = el("div", "bz-st-ends", "<span>← " + esc(spec.left || "") + "</span><span>" + esc(spec.right || "") + " →</span>");
    box.appendChild(ends);
    var rail = el("div", "bz-st-rail");
    var input = el("input");
    input.type = "range"; input.min = 0; input.max = stops.length - 1; input.step = 1; input.value = at;
    input.setAttribute("aria-label", (spec.left || "") + " to " + (spec.right || ""));
    rail.appendChild(input);
    var names = el("div", "bz-st-names");
    names.style.gridTemplateColumns = "repeat(" + stops.length + ", minmax(0, 1fr))";
    var nameBtns = stops.map(function (s, k) {
      var b = button("bz-st-name", esc(s.name));
      b.addEventListener("click", function () { go(k); });
      names.appendChild(b);
      return b;
    });
    rail.appendChild(names);
    box.appendChild(rail);
    var cardEl = el("div", "bz-st-card");
    box.appendChild(cardEl);
    input.addEventListener("input", function () { go(+input.value); });
    function meter(n, c) {
      var h = '<span class="bz-st-meter k-' + (c || "blue") + '" aria-hidden="true">';
      for (var i = 0; i < 4; i++) h += '<i class="' + (i < n ? "on" : "") + '"></i>';
      return h + "</span>";
    }
    function go(k) {
      at = k; moved = true; input.value = k;
      paint();
    }
    function paint() {
      var s = stops[at] || {};
      seen[at] = true;
      nameBtns.forEach(function (b, k) { b.classList.toggle("on", k === at); b.classList.toggle("seen", !!seen[k]); b.setAttribute("aria-pressed", String(k === at)); });
      var crowd = "";
      if (s.crowd) {
        crowd = '<div class="bz-st-crowd k-' + (s.c || "blue") + (s.crowd <= 2 ? " big" : "") + '" aria-hidden="true">';
        for (var i = 0; i < s.crowd; i++) crowd += icon(s.icon || "store");
        crowd += "</div>";
      }
      cardEl.innerHTML = '<div class="bz-st-title k-' + (s.c || "blue") + '">' + (s.crowd ? "" : icon(s.icon || "flag")) + "<span>" + esc(s.name || "") + "</span></div>" + crowd +
        '<div class="bz-st-rows">' + (s.rows || []).map(function (r) {
          return '<div class="bz-st-row"><span>' + esc(r.k) + "</span><span>" + (r.lvl != null ? meter(r.lvl, s.c) : "") + (r.t || "") + "</span></div>";
        }).join("") + "</div>" + (s.say ? '<div class="bz-st-ex">' + s.say + "</div>" : "");
      if (api.onChange) api.onChange();
    }
    paint();
    moved = false;
    function all() { return stops.every(function (s, k) { return seen[k]; }); }
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? all() : true) : moved; };
    api.check = function () {
      var key = (stops[at] || {}).key, ok = key === spec.answer;
      return { ok: ok, say: ok ? null : (spec.fb && spec.fb[key] && fmt(spec.fb[key])) || "Not that one — read the card, and compare it with what the question describes." };
    };
    api.reveal = function () {
      var k = stops.map(function (s) { return s.key; }).indexOf(spec.answer);
      if (k < 0) k = 0;
      stops.forEach(function (s, i) { seen[i] = true; });
      go(k);
    };
    return api;
  });

  /* ================================================================= Flow
     //: flow       the circular flow: households, businesses and government,
     //:            with money (yellow) and real things (blue) moving between
     Eight lanes, each tappable: tap one to light it and read what moves along
     it and why. With gate, Continue waits until every lane shown has been
     tapped. As a problem, tap the lane that answers the question (`answer` =
     a lane key).
       spec: { only: ["inputs", "income", "goods", "spending"], gate, answer }
     Lane keys: inputs, income, goods, spending (households ↔ businesses);
     taxH, services (households ↔ government); taxB, purchases (businesses ↔
     government). */
  B.css([
    ".bz-flow .lw-svg { max-height: 400px; }",
    ".bz-fl-box { fill: var(--lw-tile); stroke: var(--lw-grid); stroke-width: 1.5; }",
    ".bz-fl-name { font-size: 15px; font-weight: 700; fill: var(--ink); }",
    ".bz-fl-lane line, .bz-fl-lane path.ln { stroke-width: 3; fill: none; transition: opacity .2s, stroke-width .2s; }",
    ".bz-fl-lane .hit { stroke: transparent; stroke-width: 22; fill: none; cursor: pointer; }",
    ".bz-fl-lane text { font-size: 12.5px; fill: var(--ink-2); transition: fill .2s; pointer-events: none; }",
    ".bz-fl-lane.money .ln { stroke: var(--lw-yellow); } .bz-fl-lane.money .hd { fill: var(--lw-yellow); } .bz-fl-lane.money .dot { fill: var(--lw-yellow); }",
    ".bz-fl-lane.real .ln { stroke: var(--lw-blue); } .bz-fl-lane.real .hd { fill: var(--lw-blue); } .bz-fl-lane.real .dot { fill: var(--lw-blue); }",
    ".bz-flow.picking .bz-fl-lane:not(.on) { opacity: .35; }",
    ".bz-fl-lane.on .ln { stroke-width: 5; } .bz-fl-lane.on text { fill: var(--ink); font-weight: 650; }",
    ".bz-fl-lane:focus { outline: none; } .bz-fl-lane:focus-visible .ln { stroke-width: 6; }",
    ".bz-fl-key { display: flex; justify-content: center; gap: 18px; font-size: 13px; color: var(--ink-2); }",
    ".bz-fl-key i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; }"
  ].join("\n"));
  var FLOW_LANES = {
    inputs: { from: "H", to: "B", kind: "real", a: [172, 222], b: [508, 222], txt: "Inputs: land, labor, capital, entrepreneurship", lx: 340, ly: 214,
              say: "<b>Households → businesses: inputs.</b> People own the land, labor, capital and entrepreneurship that businesses need to make anything." },
    income: { from: "B", to: "H", kind: "money", a: [508, 258], b: [172, 258], txt: "Income: wages, rent, interest, profits", lx: 340, ly: 250,
              say: "<b>Businesses → households: income.</b> For those inputs, businesses pay wages, rent, interest and profits." },
    goods: { from: "B", to: "H", kind: "real", a: [508, 294], b: [172, 294], txt: "Goods and services", lx: 340, ly: 286,
             say: "<b>Businesses → households: goods and services</b> — what businesses make out of the inputs." },
    spending: { from: "H", to: "B", kind: "money", a: [172, 330], b: [508, 330], txt: "Spending on goods and services", lx: 340, ly: 322,
                say: "<b>Households → businesses: spending.</b> Households buy the goods and services — and that money is the businesses' revenue." },
    taxH: { from: "H", to: "G", kind: "money", a: [62, 198], b: [268, 44], txt: "Taxes", lx: 150, ly: 112, anchor: "end",
            say: "<b>Households → government: taxes</b> on what people earn and buy." },
    services: { from: "G", to: "H", kind: "real", a: [268, 76], b: [140, 198], txt: "Public services", lx: 214, ly: 150, anchor: "start",
                say: "<b>Government → households: public goods and services</b> — roads, schools, police, courts, unemployment insurance. Businesses use many of them too." },
    taxB: { from: "B", to: "G", kind: "money", a: [618, 198], b: [412, 44], txt: "Taxes", lx: 530, ly: 112, anchor: "start",
            say: "<b>Businesses → government: taxes</b> on what businesses earn." },
    purchases: { from: "G", to: "B", kind: "money", a: [412, 76], b: [540, 198], txt: "Government purchases", lx: 466, ly: 150, anchor: "end",
                 say: "<b>Government → businesses: purchases</b> — paying a builder to repair a highway, say. That is more revenue for businesses." }
  };
  CH.addKind("flow", function (spec, seed, mode) {
    var api = {}, seen = {}, picked = null, raf = 0, dead = false;
    var keys = (spec.only && spec.only.length ? spec.only : Object.keys(FLOW_LANES)).filter(function (k) { return FLOW_LANES[k]; });
    var gov = keys.some(function (k) { return /tax|services|purchases/.test(k); });
    var box = el("div", "lw bz bz-flow");
    var svg = svgRoot(680, 360, "");
    svg.setAttribute("viewBox", gov ? "0 0 680 360" : "0 170 680 190");
    svg.setAttribute("aria-label", "The circular flow of the economy");
    box.appendChild(svg);
    function node(x, y, w, h, name, ic, cls) {
      var g = S("g", { class: "bz-fl-node " + cls }, svg);
      S("rect", { x: x, y: y, width: w, height: h, rx: 16, class: "bz-fl-box" }, g);
      iconAt(g, ic, x + w / 2, y + h / 2 - 14, 34, "k-" + (cls === "gov" ? "purple" : cls === "hh" ? "green" : "orange"));
      S("text", { x: x + w / 2, y: y + h / 2 + 26, "text-anchor": "middle", class: "bz-fl-name" }, g).textContent = name;
      return g;
    }
    var lanesG = S("g", {}, svg);
    node(12, 196, 160, 144, "Households", "house", "hh");
    node(508, 196, 160, 144, "Businesses", "factory", "biz");
    if (gov) node(268, 14, 144, 94, "Government", "capitol", "gov");
    var lanes = {};
    keys.forEach(function (k) {
      var L = FLOW_LANES[k];
      var g = S("g", { class: "bz-fl-lane " + L.kind, tabindex: 0, role: "button", "aria-label": L.txt }, lanesG);
      var ang = Math.atan2(L.b[1] - L.a[1], L.b[0] - L.a[0]);
      var end = [L.b[0] - Math.cos(ang) * 10, L.b[1] - Math.sin(ang) * 10];
      S("line", { x1: L.a[0], y1: L.a[1], x2: end[0], y2: end[1], class: "ln" }, g);
      var hx = L.b[0], hy = L.b[1], s = 11;
      S("polygon", { class: "hd", points: [hx, hy, hx - s * Math.cos(ang - 0.45), hy - s * Math.sin(ang - 0.45), hx - s * Math.cos(ang + 0.45), hy - s * Math.sin(ang + 0.45)].join(" ") }, g);
      var dots = [0, 1, 2].map(function () { return S("circle", { r: 4.5, class: "dot" }, g); });
      S("line", { x1: L.a[0], y1: L.a[1], x2: L.b[0], y2: L.b[1], class: "hit" }, g);
      S("text", { x: L.lx, y: L.ly, "text-anchor": L.anchor || "middle" }, g).textContent = L.txt;
      g.addEventListener("click", function () { pick(k); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(k); } });
      lanes[k] = { g: g, dots: dots, L: L };
    });
    var key = el("div", "bz-fl-key", '<span><i style="background:var(--lw-yellow)"></i>Money</span><span><i style="background:var(--lw-blue)"></i>Real things: goods, services, inputs</span>');
    box.appendChild(key);
    var read = readout();
    box.appendChild(read);
    function place(t0) {
      keys.forEach(function (k) {
        var o = lanes[k], L = o.L;
        o.dots.forEach(function (d, i) {
          var t = ((t0 || 0) + i / 3) % 1;
          d.setAttribute("cx", L.a[0] + (L.b[0] - L.a[0]) * t);
          d.setAttribute("cy", L.a[1] + (L.b[1] - L.a[1]) * t);
        });
      });
    }
    place(0.15);
    var start = null;
    function loop(ts) {
      if (dead) return;
      raf = requestAnimationFrame(loop);
      if (document.hidden || box.offsetParent === null) return;
      if (start == null) start = ts;
      place(((ts - start) / 4200) % 1);
    }
    if (!B.reduced()) raf = requestAnimationFrame(loop);
    function pick(k) {
      picked = k; seen[k] = true;
      box.classList.add("picking");
      keys.forEach(function (x) { lanes[x].g.classList.toggle("on", x === k); });
      paint();
    }
    function paint() {
      var n = keys.filter(function (k) { return seen[k]; }).length;
      read.innerHTML = picked ? FLOW_LANES[picked].say + (mode.explore && spec.gate && n < keys.length ? ' <span class="k-muted">(' + n + " of " + keys.length + " lanes)</span>" : "")
                              : (mode.explore ? "Tap a lane to see what moves along it." : "Tap the lane that answers the question.");
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? keys.every(function (k) { return seen[k]; }) : true) : picked != null; };
    api.check = function () {
      var ok = picked === spec.answer;
      return { ok: ok, say: ok ? null : picked ? "That lane carries " + FLOW_LANES[picked].txt.toLowerCase() + ", " +
        (FLOW_LANES[picked].kind === "money" ? "which is money" : "which is real things, not money") + ", from " +
        ({ H: "households", B: "businesses", G: "government" })[FLOW_LANES[picked].from] + " to " +
        ({ H: "households", B: "businesses", G: "government" })[FLOW_LANES[picked].to] + "." : null };
    };
    api.reveal = function () { keys.forEach(function (k) { seen[k] = true; }); pick(spec.answer && lanes[spec.answer] ? spec.answer : keys[0]); };
    api.destroy = function () { dead = true; cancelAnimationFrame(raf); };
    return api;
  });

  /* ================================================================ Cycle
     //: cycle      real GDP quarter by quarter: scrub through time and read the
     //:            phase; runs of two or more falling quarters are recessions
     spec: { data: [20.0, 20.3, …] (trillions of dollars), gate,
             ask: "recession" | "peak" | "trough", answer: [quarter indexes] }
     Explore: a slider (or tapping a point) moves through the quarters, naming
     the phase and what businesses feel then; recessions are tinted. With
     gate, Continue waits until the last quarter has been reached. As a
     problem, the student taps the quarters asked for; recessions are not
     tinted until the answer is shown. */
  B.css([
    ".bz-cy-rec { fill: var(--lw-red); opacity: .13; }",
    ".bz-cy-line { fill: none; stroke: var(--lw-blue); stroke-width: 3; stroke-linejoin: round; }",
    ".bz-cy-pt { fill: var(--lw-tile); stroke: var(--lw-blue); stroke-width: 2.5; cursor: pointer; }",
    ".bz-cy-pt.dn { stroke: var(--lw-red); }",
    ".bz-cy-pt.cur { fill: var(--lw-blue); }",
    ".bz-cy-pt.sel { fill: var(--lw-orange); stroke: var(--lw-orange); }",
    ".bz-cy-pt.yes { fill: var(--lw-green); stroke: var(--lw-green); }",
    ".bz-cy-cursor { stroke: var(--ink-2); stroke-width: 1.5; stroke-dasharray: 4 4; }",
    ".bz-cy-tag { font-size: 12px; font-weight: 700; fill: var(--lw-red); letter-spacing: .04em; }",
    ".bz-cy-phase { display: inline-block; padding: 2px 10px; border-radius: 99px; font-weight: 700; font-size: 14px; background: var(--lw-surface); margin-right: 6px; }"
  ].join("\n"));
  var CYCLE_DEFAULT = [20.0, 20.3, 20.6, 20.9, 21.0, 20.8, 20.5, 20.4, 20.6, 20.9, 21.2, 21.5];
  var CYCLE_SAY = {
    Start: "The first quarter we have.",
    Expansion: "Output, jobs and incomes are growing. Businesses hire — and can struggle to find workers and supplies.",
    Peak: "The top of the cycle: activity is at its highest, just before it turns down.",
    Contraction: "Output is shrinking. Businesses sell less, cut production and may lay people off; factories run below capacity.",
    Trough: "The bottom: output stops falling here, and things turn up.",
    Recovery: "Output is growing again, but hasn't climbed back to the last peak yet.",
    Flat: "Output didn't change this quarter."
  };
  function cyclePhase(d, i) {
    if (i === 0) return "Start";
    var dn = d[i] - d[i - 1], nx = i + 1 < d.length ? d[i + 1] - d[i] : 0;
    if (dn > 0 && nx < 0) return "Peak";
    if (dn < 0 && nx > 0) return "Trough";
    if (dn > 0) return d[i] < Math.max.apply(null, d.slice(0, i)) ? "Recovery" : "Expansion";
    if (dn < 0) return "Contraction";
    return "Flat";
  }
  function cycleRecession(d) {
    var out = [], run = [];
    for (var i = 1; i <= d.length; i++) {
      if (i < d.length && d[i] < d[i - 1]) run.push(i);
      else { if (run.length >= 2) out = out.concat(run); run = []; }
    }
    return out;
  }
  B.cyclePhase = cyclePhase; B.cycleRecession = cycleRecession;
  CH.addKind("cycle", function (spec, seed, mode) {
    var api = {}, d = spec.data || CYCLE_DEFAULT, n = d.length, at = spec.start || 0, far = at, sel = {}, touched = false, revealed = false;
    var ask = mode.explore ? null : spec.ask;
    var rec = cycleRecession(d);
    var lo = Math.min.apply(null, d), hi = Math.max.apply(null, d), pad = Math.max(0.2, (hi - lo) * 0.25);
    var y0 = Math.floor((lo - pad) * 2) / 2, y1 = Math.ceil((hi + pad) * 2) / 2;
    var ticks = []; for (var t = y0; t <= y1 + 1e-9; t += (y1 - y0 > 3 ? 1 : 0.5)) ticks.push(round(t, 1));
    var box = el("div", "lw bz bz-cycle");
    var C = chart({ w: 620, h: 300, pad: [18, 16, 46, 66], x: [-0.5, n - 0.5], y: [y0, y1], yticks: ticks,
                    xticks: d.map(function (v, i) { return i; }), xfmt: function (i) { return "Q" + (i + 1); },
                    yfmt: function (v) { return "$" + v.toFixed(1) + "T"; }, xlabel: "Quarter (three months each)", ylabel: "Real GDP" });
    box.appendChild(C.svg);
    C.svg.setAttribute("aria-label", "A line of real GDP by quarter");
    var recG = S("g", {}, C.plot);
    function shade() {
      recG.innerHTML = "";
      if (ask && !revealed) return;
      var runs = [], cur = null;
      rec.forEach(function (i) { if (cur && i === cur[1] + 1) cur[1] = i; else { cur = [i, i]; runs.push(cur); } });
      runs.forEach(function (r) {
        S("rect", { x: C.X(r[0] - 1), y: C.top, width: C.X(r[1]) - C.X(r[0] - 1), height: C.bottom - C.top, class: "bz-cy-rec" }, recG);
        S("text", { x: (C.X(r[0] - 1) + C.X(r[1])) / 2, y: C.top + 14, "text-anchor": "middle", class: "bz-cy-tag" }, recG).textContent = "RECESSION";
      });
    }
    S("path", { class: "bz-cy-line", d: d.map(function (v, i) { return (i ? "L" : "M") + C.X(i) + " " + C.Y(v); }).join(" ") }, C.plot);
    var cursor = S("line", { class: "bz-cy-cursor", y1: C.top, y2: C.bottom }, C.plot);
    var pts = d.map(function (v, i) {
      var c = S("circle", { cx: C.X(i), cy: C.Y(v), r: 7, class: "bz-cy-pt" + (i && v < d[i - 1] ? " dn" : ""), tabindex: 0, role: "button",
                            "aria-label": "Quarter " + (i + 1) + ", real GDP " + v.toFixed(1) + " trillion dollars" }, C.over);
      c.addEventListener("click", function () { hit(i); });
      c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hit(i); } });
      return c;
    });
    var sl = null;
    if (!ask) {
      var sw = el("div", "lw-sliders");
      sl = slider("Quarter", { v: at + 1, min: 1, max: n, step: 1, show: function (v) { return "Q" + v; } }, function (v) { go(v - 1); });
      sw.appendChild(sl.el);
      box.appendChild(sw);
    }
    var read = readout();
    box.appendChild(read);
    function hit(i) {
      if (!ask) { go(i); if (sl) sl.set(i + 1); return; }
      if (revealed) return;
      touched = true;
      if (ask === "recession") sel[i] = !sel[i];
      else { sel = {}; sel[i] = true; }
      paint();
    }
    function go(i) { at = i; far = Math.max(far, i); touched = true; paint(); }
    function want() { return spec.answer || (ask === "recession" ? rec : []); }
    function paint() {
      shade();
      pts.forEach(function (p, i) {
        p.classList.toggle("cur", !ask && i === at);
        p.classList.toggle("sel", !!(ask && sel[i] && !revealed));
        p.classList.toggle("yes", !!(ask && revealed && want().indexOf(i) > -1));
      });
      if (!ask) {
        cursor.setAttribute("x1", C.X(at)); cursor.setAttribute("x2", C.X(at));
        var ph = cyclePhase(d, at), ch = at ? d[at] - d[at - 1] : 0;
        var inRec = rec.indexOf(at) > -1;
        var streak = 0; for (var k = at; k > 0 && d[k] < d[k - 1]; k--) streak++;
        read.innerHTML = '<span class="bz-cy-phase k-' + (/Contraction|Trough/.test(ph) ? "red" : ph === "Peak" ? "orange" : "green") + '">' + ph + "</span>" +
          "Q" + (at + 1) + ": real GDP " + esc(money(d[at], { dp: 1 })) + " trillion" +
          (at ? (ch > 0 ? ", up " : ch < 0 ? ", down " : ", no change") + (ch ? esc(money(Math.abs(ch), { dp: 1 })) + " trillion" : "") : "") + ". " +
          (inRec ? '<b class="dn">' + (streak >= 2 ? "Falling for the " + (streak === 2 ? "2nd" : streak === 3 ? "3rd" : streak + "th") + " quarter in a row — a recession." : "The start of a recession: it will fall again next quarter.") + "</b> " :
           (ch < 0 && streak === 1 ? "<b>One quarter of falling GDP isn't a recession by itself.</b> " : "")) + CYCLE_SAY[ph];
      } else {
        cursor.setAttribute("x1", -99); cursor.setAttribute("x2", -99);
        var c = Object.keys(sel).filter(function (k) { return sel[k]; }).length;
        read.innerHTML = revealed ? "The highlighted quarters are the answer." :
          (ask === "recession" ? "Tap every quarter that is part of a recession. " + (c ? c + " picked." : "") : "Tap the " + ask + ".");
      }
      if (api.onChange) api.onChange();
    }
    paint();
    touched = false;
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? far >= n - 1 : true) : touched && Object.keys(sel).some(function (k) { return sel[k]; }); };
    api.check = function () {
      var w = want(), got = Object.keys(sel).filter(function (k) { return sel[k]; }).map(Number);
      var ok = w.length === got.length && w.every(function (i) { return got.indexOf(i) > -1; });
      var extra = got.filter(function (i) { return w.indexOf(i) < 0; }), miss = w.filter(function (i) { return got.indexOf(i) < 0; });
      var say = null;
      if (!ok && ask === "recession") {
        if (extra.some(function (i) { return i === 0 || d[i] >= d[i - 1]; })) say = "A recession quarter is one where GDP fell from the quarter before — one of your picks went up.";
        else if (extra.length) say = "Q" + (extra[0] + 1) + " fell, but on its own: it takes at least two falling quarters in a row.";
        else if (miss.length) say = "There's more: every falling quarter in a run of two or more counts.";
      } else if (!ok) say = ask === "peak" ? "The peak is the highest point just before GDP starts to fall." : "The trough is the lowest point, just before GDP starts to rise.";
      if (ok) { revealed = true; paint(); }
      return { ok: ok, say: say };
    };
    api.reveal = function () { sel = {}; want().forEach(function (i) { sel[i] = true; }); touched = true; revealed = true; far = n - 1; paint(); };
    return api;
  });

  /* ================================================================ Labor
     //: labor      count a town's labor force: tap a person, then where they
     //:            belong; the unemployment rate builds as you go
     spec: { people: [{ name, story, kind: "emp" | "unemp" | "out", why }], gate }
     Three places: Employed · Unemployed and looking · Not in the labor force.
     A wrong placement bounces back with the reason. The rate uses only the
     people placed so far, with the arithmetic in words. With gate, Continue
     waits until everyone is placed. As a problem it is solved when everyone
     is placed. `story` and `why` are plain text. */
  B.css([
    ".bz-lb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }",
    ".bz-lb-p { display: grid; grid-template-columns: 30px 1fr; gap: 8px; align-items: start; text-align: left; border: 0; font: inherit; color: var(--ink);",
    "  padding: 10px 10px; border-radius: 14px; background: var(--lw-surface); cursor: pointer; box-shadow: inset 0 0 0 1.5px transparent; transition: box-shadow .15s, opacity .2s, transform .15s; }",
    ".bz-lb-p .bz-ic { width: 26px; height: 26px; color: var(--ink-2); }",
    ".bz-lb-p b { display: block; font-size: 14px; }",
    ".bz-lb-p small { display: block; font-size: 12.5px; color: var(--ink-2); line-height: 1.35; }",
    ".bz-lb-p.sel { box-shadow: inset 0 0 0 2px var(--lw-blue); }",
    ".bz-lb-p.gone { display: none; }",
    ".bz-lb-p.no { animation: bz-shake .35s; box-shadow: inset 0 0 0 2px var(--lw-red); }",
    "@keyframes bz-shake { 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }",
    ".bz-lb-bins { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }",
    ".bz-lb-bin { border: 0; font: inherit; text-align: left; padding: 10px 12px; border-radius: 14px; background: var(--lw-surface); cursor: pointer; display: grid; gap: 6px; min-height: 92px; align-content: start;",
    "  box-shadow: inset 0 0 0 1.5px var(--lw-grid); color: var(--ink); }",
    ".bz-lb-bin:hover { box-shadow: inset 0 0 0 1.5px var(--ink-2); }",
    ".bz-lb-bin > b { font-size: 14px; display: flex; justify-content: space-between; gap: 8px; }",
    ".bz-lb-bin > b span { font-variant-numeric: tabular-nums; }",
    ".bz-lb-bin.emp > b { color: var(--lw-green); } .bz-lb-bin.unemp > b { color: var(--lw-orange); } .bz-lb-bin.out > b { color: var(--ink-2); }",
    ".bz-lb-in { display: flex; flex-wrap: wrap; gap: 4px; }",
    ".bz-lb-in i { font-style: normal; font-size: 12px; padding: 2px 8px; border-radius: 99px; background: var(--lw-grid); color: var(--ink); }",
    ".bz-lb-rate { border-radius: 16px; padding: 12px 16px; background: var(--lw-surface); font-size: 15px; line-height: 1.5; text-align: center; color: var(--ink); }",
    ".bz-lb-rate b.big { font-size: 22px; color: var(--lw-orange); }",
    "@media (max-width: 560px) { .bz-lb-bins { grid-template-columns: 1fr; } }"
  ].join("\n"));
  var LABOR_DEFAULT = [
    { name: "Ana", story: "Works full-time at a bank.", kind: "emp" },
    { name: "Ben", story: "Lost his job; applies to three jobs a week.", kind: "unemp" },
    { name: "Chloe", story: "High school student, not looking for work.", kind: "out" },
    { name: "Dev", story: "Works 15 hours a week at a café.", kind: "emp", why: "A part-time job is still a job — Dev is employed." },
    { name: "Elena", story: "Retired last year.", kind: "out" },
    { name: "Farid", story: "Just graduated; interviewing for jobs.", kind: "unemp" },
    { name: "Grace", story: "Nurse at the city hospital.", kind: "emp" },
    { name: "Hugo", story: "Gave up looking — thinks no one will hire him.", kind: "out", why: "Hugo has stopped looking, so he is a discouraged worker: not counted as unemployed, and not in the labor force." },
    { name: "Ines", story: "Runs her own bakery.", kind: "emp", why: "Working for yourself counts — Ines is employed." },
    { name: "Jon", story: "Staying home to care for his baby; not job-hunting.", kind: "out" },
    { name: "Kai", story: "Laid off by a factory; sending out résumés.", kind: "unemp" },
    { name: "Lena", story: "Software engineer.", kind: "emp" }
  ];
  CH.addKind("labor", function (spec, seed, mode) {
    var api = {}, people = spec.people || LABOR_DEFAULT, where = {}, pick = null;
    var BINS = [{ k: "emp", name: "Employed" }, { k: "unemp", name: "Unemployed and looking" }, { k: "out", name: "Not in the labor force" }];
    var WHY = { emp: "has a job, so they are employed.", unemp: "has no job but is actively looking, so they are unemployed.",
                out: "isn't working and isn't looking for work, so they aren't in the labor force at all." };
    var box = el("div", "lw bz bz-labor");
    var grid = el("div", "bz-lb-grid");
    box.appendChild(grid);
    var cards = people.map(function (p, i) {
      var b = button("bz-lb-p", icon("person") + "<span><b>" + esc(p.name) + "</b><small>" + esc(p.story) + "</small></span>");
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { choose(i); });
      grid.appendChild(b);
      return b;
    });
    var bins = el("div", "bz-lb-bins");
    var binEls = {};
    BINS.forEach(function (bn) {
      var b = button("bz-lb-bin " + bn.k, "<b>" + esc(bn.name) + "<span>0</span></b><div class=\"bz-lb-in\"></div>");
      b.setAttribute("aria-label", "Put the chosen person in: " + bn.name);
      b.addEventListener("click", function () { drop(bn.k); });
      bins.appendChild(b);
      binEls[bn.k] = b;
    });
    box.appendChild(bins);
    var rate = el("div", "bz-lb-rate");
    box.appendChild(rate);
    var read = readout();
    box.appendChild(read);
    function choose(i) {
      if (where[i]) return;
      pick = pick === i ? null : i;
      cards.forEach(function (c, k) { c.classList.toggle("sel", k === pick); c.setAttribute("aria-pressed", String(k === pick)); c.classList.remove("no"); });
      read.innerHTML = pick == null ? "" : "Where does <b>" + esc(people[pick].name) + "</b> go? Tap a box below.";
    }
    function drop(k) {
      if (pick == null) { read.innerHTML = "First tap a person, then the box they belong in."; return; }
      var p = people[pick], c = cards[pick];
      if (p.kind !== k) {
        c.classList.remove("no"); void c.offsetWidth; c.classList.add("no");
        read.innerHTML = '<b class="dn">Not quite.</b> ' + esc(p.why || (p.name + " " + WHY[p.kind]));
        return;
      }
      where[pick] = k;
      c.classList.add("gone");
      read.innerHTML = '<b class="up">Yes.</b> ' + esc(p.why || (p.name + " " + WHY[k]));
      pick = null;
      paint();
    }
    function paint() {
      var n = { emp: 0, unemp: 0, out: 0 };
      BINS.forEach(function (bn) { binEls[bn.k].querySelector(".bz-lb-in").innerHTML = ""; });
      people.forEach(function (p, i) {
        if (!where[i]) return;
        n[where[i]]++;
        var chip = el("i", null, esc(p.name));
        binEls[where[i]].querySelector(".bz-lb-in").appendChild(chip);
      });
      BINS.forEach(function (bn) { binEls[bn.k].querySelector("b span").textContent = n[bn.k]; });
      var lf = n.emp + n.unemp;
      rate.innerHTML = lf ? "Labor force = employed + unemployed = " + n.emp + " + " + n.unemp + " = <b>" + lf + "</b>.<br>" +
        "Unemployment rate = " + n.unemp + " ÷ " + lf + " = <b class=\"big\">" + pct(n.unemp / lf * 100, 1) + "</b>" +
        (n.out ? '<br><span class="k-muted">The ' + n.out + " not in the labor force aren't in either number.</span>" : "")
        : "Sort the people to build the labor force.";
      if (api.onChange) api.onChange();
    }
    paint();
    function done() { return people.every(function (p, i) { return where[i]; }); }
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? done() : true) : done(); };
    api.check = function () { return { ok: done(), say: done() ? null : "Place everyone first." }; };
    api.reveal = function () { people.forEach(function (p, i) { where[i] = p.kind; cards[i].classList.add("gone"); }); pick = null; read.innerHTML = ""; paint(); };
    return api;
  });

  /* =============================================================== Basket
     //: basket     what your pay buys: prices rise, your pay may rise too — how
     //:            many baskets can you still afford?
     spec: { items: [{ i: "apple", name: "Fruit", price: 12 }, …], pay: 500,
             max: 50 (percent), step: 5, gate, goal: "same" | "fall" | "rise",
             answer: { prices: 20, pay: 20 } }
     Two sliders: how much prices have risen, and how much your pay has.
     Shows the basket's cost now, your pay now, and the baskets it buys as a
     row of icons (a part-basket drawn part-full), and says whether your
     purchasing power rose or fell, and by how much. */
  B.css([
    ".bz-bk-top { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }",
    ".bz-bk-list { border-radius: 16px; background: var(--lw-surface); padding: 12px 14px; display: grid; gap: 6px; font-size: 14.5px; }",
    ".bz-bk-list div { display: flex; align-items: center; gap: 8px; }",
    ".bz-bk-list div span { flex: 1; color: var(--ink); }",
    ".bz-bk-list div b { font-variant-numeric: tabular-nums; font-weight: 600; }",
    ".bz-bk-list .bz-ic { width: 20px; height: 20px; color: var(--lw-orange); }",
    ".bz-bk-list .tot { border-top: 1px solid var(--lw-grid); padding-top: 6px; margin-top: 2px; font-weight: 700; }",
    ".bz-bk-row { display: flex; flex-wrap: wrap; gap: 4px; padding: 12px 14px; border-radius: 16px; background: var(--lw-surface); align-content: flex-start; }",
    ".bz-bk-row .cap { width: 100%; font-size: 13px; color: var(--ink-2); margin-bottom: 4px; }",
    ".bz-bk-b { position: relative; width: 28px; height: 28px; color: var(--lw-green); }",
    ".bz-bk-b .bz-ic { width: 28px; height: 28px; position: absolute; inset: 0; }",
    ".bz-bk-b .ghost { color: var(--lw-grid); }",
    ".bz-bk-b .part { position: absolute; inset: 0; overflow: hidden; }",
    "@media (max-width: 560px) { .bz-bk-top { grid-template-columns: 1fr; } }"
  ].join("\n"));
  CH.addKind("basket", function (spec, seed, mode) {
    var api = {}, moved = false;
    var items = spec.items || [{ i: "apple", name: "Fruit and vegetables", price: 15 }, { i: "coffee", name: "Coffee and milk", price: 10 },
                               { i: "bus", name: "Bus fares", price: 15 }, { i: "shirt", name: "A T-shirt", price: 10 }];
    var base = items.reduce(function (a, x) { return a + x.price; }, 0), pay0 = spec.pay || 500;
    var mx = spec.max || 50, stp = spec.step || 5;
    var st = { p: 0, w: 0 };
    var box = el("div", "lw bz bz-basket");
    var top = el("div", "bz-bk-top");
    var list = el("div", "bz-bk-list");
    var row = el("div", "bz-bk-row");
    top.appendChild(list); top.appendChild(row);
    box.appendChild(top);
    var sw = el("div", "lw-sliders");
    var s1 = slider("Prices have risen by", { v: 0, min: 0, max: mx, step: stp, show: function (v) { return v + "%"; } }, function (v) { st.p = v; moved = true; paint(); });
    var s2 = slider("Your pay has risen by", { v: 0, min: 0, max: mx, step: stp, show: function (v) { return v + "%"; } }, function (v) { st.w = v; moved = true; paint(); });
    sw.appendChild(s1.el); sw.appendChild(s2.el);
    box.appendChild(sw);
    var read = readout();
    box.appendChild(read);
    function power(s) { return ((1 + s.w / 100) / (1 + s.p / 100) - 1) * 100; }
    function met(s) {
      var pw = power(s);
      if (!spec.goal) return true;
      if (spec.goal === "same") return s.p > 0 && Math.abs(pw) < 1e-9;
      if (spec.goal === "fall") return pw < -1e-9;
      if (spec.goal === "rise") return s.p > 0 && pw > 1e-9;
      return true;
    }
    function paint() {
      var k = 1 + st.p / 100, cost = base * k, pay = pay0 * (1 + st.w / 100), n = pay / cost, n0 = pay0 / base;
      list.innerHTML = items.map(function (x) {
        return "<div>" + icon(x.i || "basket") + "<span>" + esc(x.name) + "</span><b>" + esc(money(round(x.price * k, 2))) + "</b></div>";
      }).join("") + '<div class="tot"><span>One basket</span><b>' + esc(money(round(cost, 2))) + "</b></div>" +
        '<div class="tot"><span>Your weekly pay</span><b>' + esc(money(round(pay, 2))) + "</b></div>";
      var h = '<div class="cap">Your pay buys <b>' + round(n, 1) + "</b> baskets (it bought " + round(n0, 1) + ")</div>";
      var full = Math.floor(n + 1e-9), frac = n - full, cells = Math.max(Math.ceil(n0), Math.ceil(n));
      for (var i = 0; i < cells; i++) {
        var f = i < full ? 1 : i === full ? frac : 0;
        h += '<span class="bz-bk-b">' + icon("basket", "ghost") + (f > 0 ? '<span class="part" style="width:' + round(f * 100, 1) + '%">' + icon("basket") + "</span>" : "") + "</span>";
      }
      row.innerHTML = h;
      var pw = power(st);
      read.innerHTML = !st.p && !st.w ? "Move the sliders: let prices rise, and decide what happens to your pay." :
        "Prices up " + st.p + "%, pay up " + st.w + "%. " +
        (Math.abs(pw) < 1e-9 ? "<b>Your purchasing power is unchanged</b> — your pay kept up with prices." :
         pw < 0 ? '<b class="dn">Your purchasing power fell ' + pct(-pw, 1) + "</b> — the same pay buys less." :
                  '<b class="up">Your purchasing power rose ' + pct(pw, 1) + "</b> — your pay grew faster than prices.");
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? (spec.goal ? met(st) : moved) : true) : moved; };
    api.check = function () {
      var ok = met(st);
      return { ok: ok, say: ok ? null : spec.goal === "same" ? "To keep your purchasing power, your pay must rise by the same percent as prices." :
        spec.goal === "rise" ? "For purchasing power to rise, your pay has to grow faster than prices." : "For purchasing power to fall, prices have to rise faster than your pay." };
    };
    api.reveal = function () {
      var a = spec.answer || { prices: 20, pay: spec.goal === "rise" ? 30 : spec.goal === "fall" ? 0 : 20 };
      st.p = a.prices; st.w = a.pay; s1.set(a.prices); s2.set(a.pay); moved = true; paint();
    };
    return api;
  });

  /* =============================================================== Levers
     //: levers     the control room: the Fed's interest rate, and the
     //:            government's taxes and spending; three gauges answer
     spec: { scenario: "overheating" | "recession", gate, answer: { rate, tax, spend } }
     Each lever is Lower · Hold · Raise (−1, 0, +1). A simple, direction-true
     model: lower rates, lower taxes and more spending push the economy up
     (faster growth, fewer out of work, higher inflation); the opposites cool
     it. The goal is all three gauges in their green bands. The readout names
     the policy used. As a problem, Check tests the bands; Show me sets
     `answer`. */
  B.css([
    ".bz-lv-panels { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }",
    ".bz-lv-panel { border-radius: 16px; background: var(--lw-surface); padding: 12px 14px; display: grid; gap: 10px; align-content: start; }",
    ".bz-lv-panel h4 { margin: 0; font-size: 13px; letter-spacing: .03em; text-transform: uppercase; color: var(--ink-2); display: flex; align-items: center; gap: 8px; }",
    ".bz-lv-panel h4 .bz-ic { width: 20px; height: 20px; }",
    ".bz-lv-lever { display: grid; gap: 5px; font-size: 14px; color: var(--ink); }",
    ".bz-lv-gauges { display: grid; gap: 10px; border-radius: 16px; background: var(--lw-surface); padding: 14px 16px; }",
    ".bz-lv-g { display: grid; grid-template-columns: 130px 1fr 64px; align-items: center; gap: 12px; font-size: 14px; color: var(--ink-2); }",
    ".bz-lv-g b { text-align: right; font-size: 17px; color: var(--ink); font-variant-numeric: tabular-nums; }",
    ".bz-lv-g b.ok { color: var(--lw-green); } .bz-lv-g b.off { color: var(--lw-red); }",
    ".bz-lv-track { position: relative; height: 14px; border-radius: 7px; background: var(--lw-grid); }",
    ".bz-lv-band { position: absolute; top: 0; bottom: 0; background: var(--lw-green); opacity: .28; border-radius: 7px; }",
    ".bz-lv-g.ok .bz-lv-dot { background: var(--lw-green); } .bz-lv-g.off .bz-lv-dot { background: var(--lw-red); }",
    ".bz-lv-dot { position: absolute; top: -4px; width: 22px; height: 22px; margin-left: -11px; border-radius: 50%; background: var(--ink); box-shadow: 0 0 0 3px var(--lw-surface); transition: left .45s cubic-bezier(.2,.7,.2,1); }",
    "@media (max-width: 560px) { .bz-lv-panels { grid-template-columns: 1fr; } .bz-lv-g { grid-template-columns: 1fr 56px; } .bz-lv-g .bz-lv-track { grid-column: 1 / -1; } }"
  ].join("\n"));
  var LEVER_START = {
    overheating: { g: 5.5, u: 3.0, i: 6.5, say: "The economy is running hot: spending is racing ahead and prices are climbing fast." },
    recession: { g: -0.8, u: 7.2, i: 0.5, say: "The economy is in a recession: output is shrinking and many people are out of work." }
  };
  var LEVER_BANDS = { g: [1.5, 4], u: [3.5, 6], i: [1, 3.5] };
  CH.addKind("levers", function (spec, seed, mode) {
    var api = {}, moved = false, sc = LEVER_START[spec.scenario] || LEVER_START.overheating;
    var st = { rate: 0, tax: 0, spend: 0 };
    var box = el("div", "lw bz bz-levers");
    var panels = el("div", "bz-lv-panels");
    var fed = el("div", "bz-lv-panel"), gov = el("div", "bz-lv-panel");
    fed.innerHTML = "<h4>" + icon("bank") + "The Fed · monetary policy</h4>";
    gov.innerHTML = "<h4>" + icon("capitol") + "Government · fiscal policy</h4>";
    function lever(parent, key, name) {
      var w = el("div", "bz-lv-lever", "<span>" + esc(name) + "</span>");
      var sg = seg([{ k: -1, label: "Lower" }, { k: 0, label: "Hold" }, { k: 1, label: "Raise" }], function (v) { st[key] = v; moved = true; paint(); }, 0);
      sg.el.setAttribute("aria-label", name);
      w.appendChild(sg.el);
      parent.appendChild(w);
      return sg;
    }
    var L = { rate: lever(fed, "rate", "Interest rates"), tax: lever(gov, "tax", "Taxes"), spend: lever(gov, "spend", "Government spending") };
    panels.appendChild(fed); panels.appendChild(gov);
    box.appendChild(panels);
    var gauges = el("div", "bz-lv-gauges");
    var G = {};
    [["g", "Growth (GDP)", -2, 8], ["u", "Unemployment", 0, 10], ["i", "Inflation", 0, 9]].forEach(function (x) {
      var r = el("div", "bz-lv-g", "<span>" + x[1] + '</span><div class="bz-lv-track"><i class="bz-lv-band"></i><i class="bz-lv-dot"></i></div><b></b>');
      var band = LEVER_BANDS[x[0]], lo = x[2], hi = x[3];
      var bd = r.querySelector(".bz-lv-band");
      bd.style.left = (band[0] - lo) / (hi - lo) * 100 + "%";
      bd.style.width = (band[1] - band[0]) / (hi - lo) * 100 + "%";
      G[x[0]] = { r: r, lo: lo, hi: hi };
      gauges.appendChild(r);
    });
    box.appendChild(gauges);
    var read = readout();
    box.appendChild(read);
    function push(s) { return -s.rate - s.tax + s.spend; }
    function state(s) {
      var p = push(s);
      return { g: round(sc.g + 1.2 * p, 1), u: round(sc.u - 0.8 * p, 1), i: round(sc.i + 1.5 * p, 1) };
    }
    function inBand(k, v) { return v >= LEVER_BANDS[k][0] - 1e-9 && v <= LEVER_BANDS[k][1] + 1e-9; }
    function met(s) { var e = state(s); return inBand("g", e.g) && inBand("u", e.u) && inBand("i", e.i); }
    function named(s) {
      var out = [];
      if (s.rate > 0) out.push("contractionary monetary policy (higher interest rates)");
      if (s.rate < 0) out.push("expansionary monetary policy (lower interest rates)");
      var f = -s.tax + s.spend, bits = [];
      if (s.tax) bits.push(s.tax > 0 ? "higher taxes" : "lower taxes");
      if (s.spend) bits.push(s.spend > 0 ? "more spending" : "less spending");
      if (bits.length) out.push((f > 0 ? "expansionary" : f < 0 ? "contractionary" : "mixed") + " fiscal policy (" + bits.join(" and ") + ")");
      return out;
    }
    function paint() {
      var e = state(st);
      ["g", "u", "i"].forEach(function (k) {
        var o = G[k], v = e[k];
        o.r.querySelector(".bz-lv-dot").style.left = Math.max(0, Math.min(100, (v - o.lo) / (o.hi - o.lo) * 100)) + "%";
        var b = o.r.querySelector("b");
        b.textContent = v.toFixed(1) + "%";
        b.className = inBand(k, v) ? "ok" : "off";
        o.r.classList.toggle("ok", inBand(k, v)); o.r.classList.toggle("off", !inBand(k, v));
      });
      var p = push(st), used = named(st);
      read.innerHTML = !moved ? esc(sc.say) + " Use the levers to bring all three gauges into their green bands." :
        (used.length ? "You're using " + used.join(" and ") + ". " : "Every lever is on Hold. ") +
        (met(st) ? '<b class="up">All three gauges are in the green — a steady economy.</b>' :
         e.i > LEVER_BANDS.i[1] ? '<b class="dn">Prices are rising too fast.</b> ' + (p > 0 ? "You're pushing an economy that needs cooling." : "Cool it down more.") :
         e.g < LEVER_BANDS.g[0] ? '<b class="dn">Growth is too weak and too many are out of work.</b> ' + (p < 0 ? "You're braking an economy that needs a push." : "Give it more of a push.") :
         "Close — look at which gauge is still outside its band.");
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? met(st) : true) : moved; };
    api.check = function () { var ok = met(st); return { ok: ok, say: ok ? null : "Not all three gauges are in the green yet." }; };
    api.reveal = function () {
      var a = spec.answer || (spec.scenario === "recession" ? { rate: -1, tax: 0, spend: 1 } : { rate: 1, tax: 1, spend: 0 });
      ["rate", "tax", "spend"].forEach(function (k) { st[k] = a[k] || 0; L[k].set(st[k]); });
      moved = true; paint();
    };
    return api;
  });

  /* =============================================================== Market
     //: market     supply and demand: move the price and watch the gap between
     //:            what buyers want and sellers offer; shift the curves with
     //:            events and watch the equilibrium move
     Straight-line curves: quantity demanded Qd = a − b·P, quantity supplied
     Qs = c + d·P. Two modes:
       price  (default) a price line you drag (or slide); at that price the
              scene marks Qd and Qs, brackets the gap as a surplus or a
              shortage, and says what the market will do about it.
              ask: "equilibrium" makes finding the meeting point the goal.
       shift  (spec.events) buttons that shift one curve right or left; the
              old curve stays as a ghost and the old and new equilibria are
              both marked, with the change said in words.
     spec: { good: "concert T-shirts", unit: "shirts",
             demand: { a: 1000, b: 20 }, supply: { c: 100, d: 25 },
             price: { v, min, max, step }, qmax: 1200, pmax: 45,
             schedule: [10, 15, 20, 25, 30], ask, gate, answer: { price },
             events: [{ name: "A famous band wears them", curve: "demand", dir: 1, size: 225 }] }
     Show me sets the equilibrium price (price mode) or applies every event
     (shift mode). */
  B.css([
    ".bz-mk .lw-svg { max-height: 360px; }",
    ".bz-mk-d { stroke: var(--lw-blue); stroke-width: 3.5; fill: none; stroke-linecap: round; }",
    ".bz-mk-s { stroke: var(--lw-orange); stroke-width: 3.5; fill: none; stroke-linecap: round; }",
    ".bz-mk-ghost { stroke-width: 2.5; stroke-dasharray: 6 6; opacity: .45; }",
    ".bz-mk-cl { font-size: 15px; font-weight: 800; }",
    ".bz-mk-cl.d { fill: var(--lw-blue); } .bz-mk-cl.s { fill: var(--lw-orange); }",
    ".bz-mk-pl { stroke: var(--ink-2); stroke-width: 1.5; stroke-dasharray: 5 5; }",
    ".bz-mk-knob { fill: var(--ink); stroke: var(--lw-surface); stroke-width: 3; }",
    ".bz-mk-knobt { font-size: 12px; font-weight: 700; fill: var(--lw-surface); pointer-events: none; }",
    ".bz-mk-dot.d { fill: var(--lw-blue); } .bz-mk-dot.s { fill: var(--lw-orange); }",
    ".bz-mk-gap { stroke-width: 7; stroke-linecap: round; opacity: .55; }",
    ".bz-mk-gap.sur { stroke: var(--lw-purple); } .bz-mk-gap.sho { stroke: var(--lw-red); }",
    ".bz-mk-gapt { font-size: 13px; font-weight: 700; }",
    ".bz-mk-gapt.sur { fill: var(--lw-purple); } .bz-mk-gapt.sho { fill: var(--lw-red); }",
    ".bz-mk-e { fill: var(--lw-green); stroke: var(--lw-surface); stroke-width: 2.5; }",
    ".bz-mk-e.old { fill: var(--lw-surface); stroke: var(--ink-2); stroke-width: 2; }",
    ".bz-mk-et { font-size: 12.5px; font-weight: 700; fill: var(--lw-green); }",
    ".bz-mk-et.old { fill: var(--ink-2); font-weight: 600; }",
    ".bz-mk-guide { stroke: var(--lw-green); stroke-width: 1.2; stroke-dasharray: 3 4; opacity: .8; }",
    ".bz-mk-lay { display: grid; gap: 10px; }",
    ".bz-mk-tab { border-collapse: separate; border-spacing: 0; font-size: 14px; border-radius: 14px; overflow: hidden; background: var(--lw-surface); justify-self: center; }",
    ".bz-mk-tab th, .bz-mk-tab td { padding: 6px 14px; text-align: center; font-variant-numeric: tabular-nums; }",
    ".bz-mk-tab th:first-child { text-align: left; }",
    ".bz-mk-tab th { font-size: 12px; color: var(--ink-2); font-weight: 600; }",
    ".bz-mk-tab th.d { color: var(--lw-blue); } .bz-mk-tab th.s { color: var(--lw-orange); }",
    ".bz-mk-tab td.on { background: color-mix(in srgb, var(--lw-blue) 18%, transparent); font-weight: 700; color: var(--ink); }",
    ".bz-mk-ev { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }",
    ".bz-mk-ev .lw-btn.on { box-shadow: inset 0 0 0 2px var(--lw-green); }",
    ".bz-mk-tab th.row { text-align: left; }"
  ].join("\n"));
  CH.addKind("market", function (spec, seed, mode) {
    var api = {}, moved = false, stop = function () {};
    var D0 = Object.assign({ a: 1000, b: 20 }, spec.demand || {}), S0 = Object.assign({ c: 100, d: 25 }, spec.supply || {});
    var cur = { a: D0.a, c: S0.c };
    var qmax = spec.qmax || 1200, pmax = spec.pmax || 45, unit = spec.unit || "items";
    var PR = Object.assign({ v: 30, min: 0, max: pmax - 5, step: 1 }, spec.price || {});
    var shiftMode = !!(spec.events && spec.events.length), applied = {};
    function shiftMode2() { return shiftMode; }
    var P = PR.v;
    var box = el("div", "lw bz bz-mk");
    var lay = el("div", "bz-mk-lay");
    box.appendChild(lay);
    function step(v) { return v <= 60 ? 5 : v <= 150 ? 10 : v <= 400 ? 50 : 100; }
    var qt = []; for (var q = 0; q <= qmax + 1e-9; q += qmax / 6) qt.push(round(q, 0));
    var pt = []; for (var p = 0; p <= pmax + 1e-9; p += step(pmax)) pt.push(p);
    var C = chart({ w: 600, h: 340, pad: [16, shiftMode2() ? 26 : 76, 48, 64], x: [0, qmax], y: [0, pmax], xticks: qt, yticks: pt,
                    xfmt: function (v) { return count(v); }, yfmt: function (v) { return money(v); },
                    xlabel: "Quantity (" + unit + ")", ylabel: "Price" });
    C.svg.setAttribute("aria-label", "Supply and demand for " + (spec.good || unit));
    lay.appendChild(C.svg);
    var tab = null;
    if (spec.schedule && !shiftMode) {
      tab = el("table", "bz-mk-tab");
      lay.appendChild(tab);
    }
    var ghostG = S("g", {}, C.plot), curveG = S("g", {}, C.plot), markG = S("g", {}, C.plot);
    function qd(pp, a) { return (a == null ? cur.a : a) - D0.b * pp; }
    function qs(pp, c) { return (c == null ? cur.c : c) + S0.d * pp; }
    function eq(a, c) { var pe = (a - c) / (D0.b + S0.d); return { p: pe, q: a - D0.b * pe }; }
    function seg(g, cls, f, lab) {
      // the part of the line with 0 ≤ Q ≤ qmax and 0 ≤ P ≤ pmax
      var pts = [];
      for (var i = 0; i <= 200; i++) {
        var pp = pmax * i / 200, qq = f(pp);
        if (qq >= 0 && qq <= qmax) pts.push([C.X(qq), C.Y(pp)]);
      }
      if (pts.length < 2) return;
      S("path", { class: cls, d: pts.map(function (x, i) { return (i ? "L" : "M") + round(x[0], 1) + " " + round(x[1], 1); }).join(" ") }, g);
      if (lab) {
        var endp = pts[pts.length - 1];
        S("text", { x: endp[0] + (lab === "D" ? 12 : 8), y: endp[1] + (lab === "D" ? 2 : 14), class: "bz-mk-cl " + lab.toLowerCase() }, g).textContent = lab;
      }
    }
    function drawCurves() {
      ghostG.innerHTML = ""; curveG.innerHTML = "";
      if (cur.a !== D0.a) seg(ghostG, "bz-mk-d bz-mk-ghost", function (pp) { return qd(pp, D0.a); });
      if (cur.c !== S0.c) seg(ghostG, "bz-mk-s bz-mk-ghost", function (pp) { return qs(pp, S0.c); });
      seg(curveG, "bz-mk-d", function (pp) { return qd(pp); }, "D");
      seg(curveG, "bz-mk-s", function (pp) { return qs(pp); }, "S");
    }
    // The price line and its knob (price mode).
    var pl = null, knob = null, knobT = null, sl = null;
    if (!shiftMode) {
      pl = S("line", { class: "bz-mk-pl", x1: C.left, x2: C.right }, C.over);
      var kg = S("g", { role: "slider", "aria-label": "Price", "aria-valuemin": PR.min, "aria-valuemax": PR.max }, C.over);
      knob = S("rect", { class: "bz-mk-knob", x: C.right + 8, width: 58, height: 26, rx: 13 }, kg);
      knobT = S("text", { class: "bz-mk-knobt", x: C.right + 37, "text-anchor": "middle" }, kg);
      draggable(C.svg, kg, {
        move: function (pt2) { setP(C.iY(pt2.y)); },
        key: function (dx, dy) { setP(P + (dy || dx) * PR.step); }
      });
      var sw = el("div", "lw-sliders");
      sl = slider("Price", { v: P, min: PR.min, max: PR.max, step: PR.step, show: function (v) { return usd(v); } }, function (v) { setP(v); });
      sw.appendChild(sl.el);
      box.appendChild(sw);
    }
    var evBox = null, evBtns = [];
    if (shiftMode) {
      evBox = el("div", "bz-mk-ev");
      spec.events.forEach(function (ev, k) {
        var b = btn(esc(ev.name));
        b.addEventListener("click", function () { apply(k); });
        evBox.appendChild(b);
        evBtns.push(b);
      });
      var rs = btn("Reset", "ghost");
      rs.addEventListener("click", function () { applied = {}; animateTo(D0.a, S0.c, null); });
      evBox.appendChild(rs);
      box.appendChild(evBox);
    }
    var read = readout();
    box.appendChild(read);
    function setP(v) {
      v = clamp(snapTo(v, PR.step), PR.min, PR.max);
      if (v === P && moved) return;
      P = round(v, 2); moved = true;
      if (sl) sl.set(P);
      paint();
    }
    var last = null;
    function apply(k) {
      var ev = spec.events[k];
      applied = {}; applied[k] = true;                // one event at a time, from the start
      var a = D0.a, c = S0.c;
      if (ev.curve === "demand") a += ev.dir * (ev.size || 225); else c += ev.dir * (ev.size || 225);
      last = ev;
      moved = true;
      animateTo(a, c, ev);
    }
    function animateTo(a, c, ev) {
      stop();
      var a0 = cur.a, c0 = cur.c;
      last = ev;
      stop = tween(0, 1, 450, function (t) { cur.a = a0 + (a - a0) * t; cur.c = c0 + (c - c0) * t; paint(true); }, function () { cur.a = a; cur.c = c; paint(); });
    }
    function paint(quick) {
      drawCurves();
      markG.innerHTML = "";
      var E = eq(cur.a, cur.c), E0 = eq(D0.a, S0.c);
      if (shiftMode) {
        evBtns.forEach(function (b, k) { b.classList.toggle("on", !!applied[k]); });
        var shifted = cur.a !== D0.a || cur.c !== S0.c;
        function mark(e, cls, lab) {
          S("line", { class: "bz-mk-guide", x1: C.left, x2: C.X(e.q), y1: C.Y(e.p), y2: C.Y(e.p) }, markG);
          S("line", { class: "bz-mk-guide", x1: C.X(e.q), x2: C.X(e.q), y1: C.Y(e.p), y2: C.bottom }, markG);
          S("circle", { cx: C.X(e.q), cy: C.Y(e.p), r: 7, class: "bz-mk-e " + cls }, markG);
          S("text", { x: C.X(e.q) + 11, y: C.Y(e.p) - 9, class: "bz-mk-et " + cls }, markG).textContent = lab;
        }
        if (shifted) mark(E0, "old", "E₁");
        mark(E, "", shifted ? "E₂" : "E");
        if (!quick) {
          if (!shifted) read.innerHTML = "At the start, the curves cross at <b>" + esc(money(round(E.p, 2))) + "</b> and <b>" + count(E.q) + "</b> " + esc(unit) + ". Try an event.";
          else {
            var ev = last || {};
            var what = (ev.curve === "demand" ? "Demand" : "Supply") + (ev.dir > 0 ? " increased — the curve shifted right." : " decreased — the curve shifted left.");
            read.innerHTML = "<b>" + esc(what) + "</b> The price went " + (E.p > E0.p ? "up" : "down") + " from " + esc(money(round(E0.p, 2))) + " to <b>" +
              esc(money(round(E.p, 2))) + "</b>, and the quantity went " + (E.q > E0.q ? "up" : "down") + " from " + count(E0.q) + " to <b>" + count(E.q) + "</b>.";
          }
        }
      } else {
        var d = qd(P), s = qs(P), y = C.Y(P);
        pl.setAttribute("y1", y); pl.setAttribute("y2", y);
        knob.setAttribute("y", y - 13); knobT.setAttribute("y", y + 4.5); knobT.textContent = money(P);
        var dq = clamp(d, 0, qmax), sq = clamp(s, 0, qmax);
        var gap = round(d - s, 0);
        if (Math.abs(gap) >= 1) {
          var cls = gap > 0 ? "sho" : "sur";
          S("line", { class: "bz-mk-gap " + cls, x1: C.X(Math.min(dq, sq)), x2: C.X(Math.max(dq, sq)), y1: y, y2: y }, markG);
          var tx = (C.X(dq) + C.X(sq)) / 2;
          S("text", { class: "bz-mk-gapt " + cls, x: clamp(tx, C.left + 60, C.right - 60), y: y - 12, "text-anchor": "middle" }, markG).textContent =
            (gap > 0 ? "Shortage of " : "Surplus of ") + count(Math.abs(gap));
        } else {
          S("circle", { cx: C.X(d), cy: y, r: 8, class: "bz-mk-e" }, markG);
          S("text", { x: C.X(d) + 12, y: y - 10, class: "bz-mk-et" }, markG).textContent = "Equilibrium";
        }
        if (d >= 0 && d <= qmax) S("circle", { cx: C.X(d), cy: y, r: 6, class: "bz-mk-dot d" }, markG);
        if (s >= 0 && s <= qmax) S("circle", { cx: C.X(s), cy: y, r: 6, class: "bz-mk-dot s" }, markG);
        if (tab) {
          var on = function (pp) { return Math.abs(pp - P) < 1e-9 ? ' class="on"' : ""; };
          tab.innerHTML = '<tr><th class="row">Price</th>' + spec.schedule.map(function (pp) { return "<td" + on(pp) + "><b>" + esc(money(pp)) + "</b></td>"; }).join("") + "</tr>" +
            '<tr><th class="row d">Buyers want</th>' + spec.schedule.map(function (pp) { return "<td" + on(pp) + ">" + count(qd(pp)) + "</td>"; }).join("") + "</tr>" +
            '<tr><th class="row s">Sellers offer</th>' + spec.schedule.map(function (pp) { return "<td" + on(pp) + ">" + count(qs(pp)) + "</td>"; }).join("") + "</tr>";
        }
        read.innerHTML = "At <b>" + esc(money(P)) + "</b>, buyers want <b class=\"k-blue\">" + count(Math.max(0, d)) + "</b> " + esc(unit) +
          " and sellers offer <b class=\"k-orange\">" + count(Math.max(0, s)) + "</b>. " +
          (gap > 0 ? '<b class="dn">A shortage:</b> ' + esc(unit) + " sell out and people are left wanting, so the price gets pushed up." :
           gap < 0 ? '<b style="color:var(--lw-purple)">A surplus:</b> unsold ' + esc(unit) + " pile up, so sellers cut the price." :
           '<b class="up">Equilibrium:</b> buyers want exactly what sellers offer, so the price has no reason to move.');
      }
      if (api.onChange) api.onChange();
    }
    drawCurves();
    paint();
    moved = false;
    function atEq() { return Math.abs(qd(P) - qs(P)) < 1; }
    api.el = box;
    api.ready = function () {
      if (mode.explore) return spec.gate ? (shiftMode ? Object.keys(applied).length > 0 : spec.ask === "equilibrium" ? atEq() : moved) : true;
      return moved;
    };
    api.check = function () {
      if (shiftMode) return { ok: true };
      var ok = atEq();
      return { ok: ok, say: ok ? null : qd(P) > qs(P) ? "At that price there's a shortage — buyers want more than sellers offer. Which way will the price go?" :
        "At that price there's a surplus — sellers offer more than buyers want. Which way will the price go?" };
    };
    api.reveal = function () {
      if (shiftMode) { apply(0); return; }
      var e = spec.answer && spec.answer.price != null ? spec.answer.price : eq(cur.a, cur.c).p;
      P = e; moved = true; if (sl) sl.set(P); paint();
    };
    api.destroy = function () { stop(); };
    return api;
  });

  /* =============================================================== Retain
     //: retain     keeping customers: how many are left after five years if a
     //:            business loses a share of them every year
     spec: { start: 1000, lose: 15 (percent a year), perCustomer: 100 (profit a
             year from each), years: 5, compare: 15, gate, goal: { lose: 10 } }
     A slider for the share lost each year; bars for the customers still
     there at the start of each year, with the `compare` rate as faint bars
     behind; profit over the years totalled underneath. */
  B.css([
    ".bz-rt-bars { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 10px; align-items: end; height: 190px; padding: 14px 16px 0; border-radius: 16px 16px 0 0; background: var(--lw-surface); }",
    ".bz-rt-col { position: relative; height: 100%; display: flex; align-items: flex-end; justify-content: center; }",
    ".bz-rt-bar { display: block; position: relative; width: 70%; border-radius: 8px 8px 0 0; background: var(--lw-green); transition: height .3s ease; }",
    ".bz-rt-ghost { display: block; position: absolute; bottom: 0; width: 70%; border-radius: 8px 8px 0 0; box-shadow: inset 0 0 0 2px var(--ink-2); opacity: .35; }",
    ".bz-rt-bar b { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 12.5px; color: var(--ink); font-variant-numeric: tabular-nums; white-space: nowrap; }",
    ".bz-rt-yrs { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 10px; padding: 6px 16px 12px; border-radius: 0 0 16px 16px; background: var(--lw-surface); font-size: 12.5px; color: var(--ink-2); text-align: center; margin-top: -14px; }"
  ].join("\n"));
  CH.addKind("retain", function (spec, seed, mode) {
    var api = {}, moved = false;
    var N0 = spec.start || 1000, yrs = spec.years || 5, per = spec.perCustomer || 100, cmp = spec.compare;
    var lose = spec.lose != null ? spec.lose : 15;
    var box = el("div", "lw bz bz-retain");
    var bars = el("div", "bz-rt-bars"), yl = el("div", "bz-rt-yrs");
    box.appendChild(bars); box.appendChild(yl);
    var sw = el("div", "lw-sliders");
    var sl = slider("Customers lost each year", { v: lose, min: 0, max: 30, step: 1, show: function (v) { return v + "%"; } }, function (v) { lose = v; moved = true; paint(); });
    sw.appendChild(sl.el);
    box.appendChild(sw);
    var k = kpis([{ k: "left", label: "Customers after " + yrs + " years" }, { k: "profit", label: "Profit over " + yrs + " years", color: "green" }]);
    box.appendChild(k.el);
    var read = readout();
    box.appendChild(read);
    function run(r) {
      var out = [], n = N0;
      for (var y = 0; y < yrs; y++) { out.push(n); n = n * (1 - r / 100); }
      return { kept: out, after: n };
    }
    function total(r) { return run(r).kept.reduce(function (a, n) { return a + Math.round(n) * per; }, 0); }
    function paint() {
      var R = run(lose), G = cmp != null ? run(cmp) : null;
      bars.innerHTML = ""; yl.innerHTML = "";
      R.kept.forEach(function (n, y) {
        var col = el("div", "bz-rt-col");
        if (G) { var g = el("span", "bz-rt-ghost"); g.style.height = G.kept[y] / N0 * 100 + "%"; col.appendChild(g); }
        var b = el("span", "bz-rt-bar"); b.style.height = n / N0 * 100 + "%";
        b.innerHTML = "<b>" + count(n) + "</b>";
        col.appendChild(b);
        bars.appendChild(col);
        yl.appendChild(el("span", null, "Year " + (y + 1)));
      });
      k.set("left", count(R.after));
      k.set("profit", esc(money(total(lose))));
      read.innerHTML = "Losing " + lose + "% a year, " + count(N0) + " customers become " + count(R.after) + " after " + yrs + " years" +
        (G && cmp !== lose ? " (at " + cmp + "% it would be " + count(G.after) + ", the faint bars). Profit changes by <b class=\"" + (total(lose) >= total(cmp) ? "up" : "dn") + "\">" +
          esc(money(total(lose) - total(cmp), { plus: true })) + "</b>." : ".") +
        " Each customer who stays brings in " + esc(money(per)) + " of profit a year.";
      if (api.onChange) api.onChange();
    }
    paint();
    function met() { return !spec.goal || spec.goal.lose == null || lose === spec.goal.lose; }
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? moved && met() : true) : moved; };
    api.check = function () { var ok = met(); return { ok: ok, say: ok ? null : "Set the yearly loss to " + (spec.goal && spec.goal.lose) + "%." }; };
    api.reveal = function () { if (spec.goal && spec.goal.lose != null) { lose = spec.goal.lose; sl.set(lose); } moved = true; paint(); };
    return api;
  });

  /* ============================================================= Dilemma
     //: dilemma    a hard choice: pick an option and see how it lands on each
     //:            person or group it touches — then try the others
     Ethics is about consequences and duties to real people, so the choice is
     made first and the outcome shown after: a row per stakeholder with an
     arrow (better off, worse off, no change) and a line saying why, plus a
     closing sentence. With gate, Continue waits until every option has been
     tried. As a problem, the student picks one and Check compares it with
     `answer`.
       spec: { options: [{ key, t: "Pay the bribe", say: "…",
                           effects: [{ who: "Employees", i: "worker", d: 1 | 0 | -1, t: "…" }] }],
               gate, answer, fb: { key: "…" } }
     `t` and `say` are lesson text (formatted by the lab); `who` is plain. */
  B.css([
    ".bz-dl-opts { display: grid; gap: 8px; }",
    ".bz-dl-opt { display: flex; align-items: center; gap: 12px; text-align: left; border: 0; font: inherit; font-size: 15.5px; color: var(--ink);",
    "  padding: 12px 14px; border-radius: 14px; background: var(--lw-surface); cursor: pointer; box-shadow: inset 0 0 0 1.5px var(--lw-grid); }",
    ".bz-dl-opt:hover { box-shadow: inset 0 0 0 1.5px var(--ink-2); }",
    ".bz-dl-opt.on { box-shadow: inset 0 0 0 2px var(--lw-blue); }",
    ".bz-dl-opt .tag { margin-left: auto; font-size: 12px; color: var(--ink-2); white-space: nowrap; }",
    ".bz-dl-opt .tag.seen { color: var(--lw-green); }",
    ".bz-dl-opt .let { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 700; background: var(--lw-grid); }",
    ".bz-dl-out { border-radius: 16px; background: var(--lw-surface); padding: 12px 14px; display: grid; gap: 8px; }",
    ".bz-dl-out.in { animation: bz-rise .3s cubic-bezier(.2,.7,.2,1) both; }",
    ".bz-dl-row { display: grid; grid-template-columns: 26px 110px 22px 1fr; gap: 10px; align-items: center; font-size: 14.5px; line-height: 1.4; }",
    ".bz-dl-row .bz-ic { width: 22px; height: 22px; color: var(--ink-2); }",
    ".bz-dl-row b { font-size: 13.5px; color: var(--ink-2); font-weight: 600; }",
    ".bz-dl-row .d { font-size: 17px; font-weight: 800; text-align: center; }",
    ".bz-dl-row .d.up { color: var(--lw-green); } .bz-dl-row .d.dn { color: var(--lw-red); } .bz-dl-row .d.eq { color: var(--ink-2); }",
    ".bz-dl-say { border-top: 1px solid var(--lw-grid); padding-top: 8px; font-size: 15px; color: var(--ink); }",
    "@media (max-width: 560px) { .bz-dl-row { grid-template-columns: 22px 1fr 20px; } .bz-dl-row > span:last-child { grid-column: 1 / -1; } }"
  ].join("\n"));
  CH.addKind("dilemma", function (spec, seed, mode) {
    var api = {}, opts = spec.options || [], tried = {}, pick = null;
    var box = el("div", "lw bz bz-dilemma");
    var list = el("div", "bz-dl-opts");
    box.appendChild(list);
    var out = el("div", "bz-dl-out");
    out.hidden = true;
    box.appendChild(out);
    var read = readout();
    box.appendChild(read);
    var btns = opts.map(function (o, k) {
      var b = button("bz-dl-opt", '<span class="let">' + String.fromCharCode(65 + k) + "</span><span>" + (o.t || "") + '</span><span class="tag"></span>');
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { choose(k); });
      list.appendChild(b);
      return b;
    });
    function choose(k) {
      pick = k; tried[k] = true;
      var o = opts[k];
      btns.forEach(function (b, i) {
        b.classList.toggle("on", i === k); b.setAttribute("aria-pressed", String(i === k));
        var tg = b.querySelector(".tag");
        tg.textContent = tried[i] ? (mode.explore ? "tried ✓" : "") : "";
        tg.classList.toggle("seen", !!tried[i]);
      });
      out.hidden = false;
      out.classList.remove("in"); void out.offsetWidth; if (!B.reduced()) out.classList.add("in");
      out.innerHTML = (o.effects || []).map(function (e) {
        var d = e.d > 0 ? '<span class="d up" aria-label="better off">▲</span>' : e.d < 0 ? '<span class="d dn" aria-label="worse off">▼</span>' : '<span class="d eq" aria-label="no change">–</span>';
        return '<div class="bz-dl-row">' + icon(e.i || "person") + "<b>" + esc(e.who || "") + "</b>" + d + "<span>" + (e.t || "") + "</span></div>";
      }).join("") + (o.say ? '<div class="bz-dl-say">' + o.say + "</div>" : "");
      paint();
    }
    function paint() {
      var n = Object.keys(tried).length;
      read.innerHTML = pick == null ? (mode.explore ? "Pick a choice to see what happens." : "Pick the choice you think is best.") :
        mode.explore && spec.gate && n < opts.length ? "Now try another choice — " + n + " of " + opts.length + " tried." : "";
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? Object.keys(tried).length >= opts.length : true) : pick != null; };
    api.check = function () {
      var key = pick != null ? opts[pick].key : null, ok = key === spec.answer;
      return { ok: ok, say: ok ? null : (spec.fb && spec.fb[key] && fmt(spec.fb[key])) || "Look again at who is harmed by that choice, and whether it's honest and fair." };
    };
    api.reveal = function () {
      opts.forEach(function (o, i) { tried[i] = true; });
      var k = opts.map(function (o) { return o.key; }).indexOf(spec.answer);
      choose(k < 0 ? 0 : k);
    };
    return api;
  });

  /* ============================================================= Pyramid
     //: pyramid    a pyramid built from the bottom up — each level only
     //:            appears once the one beneath it is in place (the CSR pyramid)
     spec: { levels: [{ key, name, i, c, t }] (bottom first; default: the four
             responsibilities of corporate social responsibility), gate,
             answer: key, fb: { key: "…" } }
     Explore: the next level up is a dashed outline; tapping it lays it
     down and says what it means. With gate, Continue waits until the whole
     pyramid is built. As a problem the pyramid is complete, and the student
     taps the level the question is about. */
  B.css([
    ".bz-py .lw-svg { max-height: 330px; }",
    ".bz-py-lv { cursor: pointer; }",
    ".bz-py-lv path { stroke: var(--lw-surface); stroke-width: 3; transition: opacity .3s, transform .3s; }",
    ".bz-py-lv.todo path { fill: transparent; stroke: var(--ink-2); stroke-dasharray: 6 6; stroke-width: 1.5; }",
    ".bz-py-lv.todo text { fill: var(--ink-2); }",
    ".bz-py-lv.hidden { opacity: 0; pointer-events: none; }",
    ".bz-py-lv.on path { stroke: var(--ink); stroke-width: 3; }",
    ".bz-py-lv text { font-size: 15px; font-weight: 700; fill: #fff; pointer-events: none; }",
    ".bz-py-lv:focus { outline: none; } .bz-py-lv:focus-visible path { stroke: var(--blue); stroke-width: 4; }",
    ".bz-py-card { border-radius: 16px; background: var(--lw-surface); padding: 12px 16px; font-size: 15.5px; line-height: 1.45; color: var(--ink); min-height: 48px; }",
    ".bz-py-card b.nm { display: block; font-size: 13px; letter-spacing: .03em; text-transform: uppercase; margin-bottom: 2px; }"
  ].join("\n"));
  var PYRAMID_CSR = [
    { key: "eco", name: "Economic", c: "blue", t: "**Be profitable.** A business that can't make a profit won't survive — so this is the foundation for everything above it." },
    { key: "leg", name: "Legal", c: "purple", t: "**Obey the law.** Society's rules for business, written down." },
    { key: "eth", name: "Ethical", c: "orange", t: "**Do what is right, just and fair** — even where no law requires it." },
    { key: "phi", name: "Philanthropic", c: "green", t: "**Be a good corporate citizen:** give money, products and time to make the community better." }
  ];
  CH.addKind("pyramid", function (spec, seed, mode) {
    var api = {}, lv = spec.levels || PYRAMID_CSR.map(function (L) { return Object.assign({}, L, { t: fmt(L.t) }); }), n = lv.length, built = mode.explore ? 0 : n, pick = null, seen = {};
    var box = el("div", "lw bz bz-py");
    var W = 520, H = 60 * n + 30;
    var svg = svgRoot(W, H, "");
    svg.setAttribute("aria-label", "A pyramid with " + n + " levels");
    box.appendChild(svg);
    var card = el("div", "bz-py-card");
    box.appendChild(card);
    var groups = lv.map(function (L, k) {
      // Level k from the bottom: a trapezoid (the top one a triangle).
      var yb = H - 10 - k * 60, yt = yb - 56;
      // A stepped pyramid with a flat top, so every level has room for its name.
      function half(y) { return (y - 10) / (H - 20) * (W / 2 - 70) + 44; }
      var hb = half(yb), ht = half(yt);
      var g = S("g", { class: "bz-py-lv", tabindex: 0, role: "button", "aria-label": L.name }, svg);
      var p = S("path", { d: "M" + (W / 2 - hb) + " " + yb + "L" + (W / 2 + hb) + " " + yb + "L" + (W / 2 + ht) + " " + yt + "L" + (W / 2 - ht) + " " + yt + "Z",
                          class: "f-" + (L.c || "blue") }, g);
      var tx = S("text", { x: W / 2, y: yb - 23, "text-anchor": "middle" }, g);
      tx.textContent = L.name;
      g.addEventListener("click", function () { tap(k); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(k); } });
      return { g: g, tx: tx };
    });
    function tap(k) {
      if (k >= built) { if (k === built) { built++; seen[k] = true; pick = k; } else return; }
      else { pick = k; seen[k] = true; }
      paint();
    }
    function paint() {
      groups.forEach(function (o, k) {
        o.g.classList.toggle("todo", k === built && mode.explore);
        o.g.classList.toggle("hidden", k > built || (k === built && !mode.explore));
        o.g.classList.toggle("on", k === pick);
        o.tx.textContent = k === built && mode.explore ? "Tap to add the next level" : lv[k].name;
      });
      card.innerHTML = pick != null ? '<b class="nm k-' + (lv[pick].c || "blue") + '">' + esc(lv[pick].name) + "</b>" + (lv[pick].t || "") :
        mode.explore ? "Start at the bottom: tap the dashed level to lay the foundation." : "Tap the level the question is about.";
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? built >= n : true) : pick != null; };
    api.check = function () {
      var key = pick != null ? lv[pick].key : null, ok = key === spec.answer;
      return { ok: ok, say: ok ? null : (spec.fb && spec.fb[key] && fmt(spec.fb[key])) || "Not that level — read what each one asks of a business." };
    };
    api.reveal = function () {
      built = n;
      var k = lv.map(function (L) { return L.key; }).indexOf(spec.answer);
      pick = k < 0 ? n - 1 : k;
      paint();
    };
    return api;
  });

  /* ================================================================= Hub
     //: hub        one thing in the middle and the groups around it: tap each
     //:            to see what it expects (a company and its stakeholders)
     spec: { center: { i: "store", name: "The company" },
             nodes: [{ key, i, name, c, t }], gate, answer: key, fb: { key: "…" } }
     Explore: tapping a node lights its spoke and shows its text; with gate,
     Continue waits until every node has been opened. As a problem, tap the
     node the question describes. `t` is lesson text; `name` is plain. */
  B.css([
    ".bz-hub .lw-svg { max-height: 360px; }",
    ".bz-hb-spoke { stroke: var(--lw-grid); stroke-width: 3; transition: stroke .2s; }",
    ".bz-hb-spoke.on { stroke: currentColor; stroke-width: 4; }",
    ".bz-hb-c { fill: var(--lw-tile); stroke: var(--lw-grid); stroke-width: 2; }",
    ".bz-hb-n circle { fill: var(--lw-tile); stroke: currentColor; stroke-width: 2.5; transition: stroke-width .2s; }",
    ".bz-hb-n { cursor: pointer; }",
    ".bz-hb-n.seen circle { fill: color-mix(in srgb, currentColor 16%, var(--lw-tile)); }",
    ".bz-hb-n.on circle { stroke-width: 5; }",
    ".bz-hb-n:focus { outline: none; } .bz-hb-n:focus-visible circle { stroke: var(--blue); stroke-width: 5; }",
    ".bz-hb-lab { font-size: 14px; font-weight: 700; fill: var(--ink); pointer-events: none; }",
    ".bz-hb-card { border-radius: 16px; background: var(--lw-surface); padding: 12px 16px; font-size: 15.5px; line-height: 1.45; color: var(--ink); min-height: 48px; }",
    ".bz-hb-card b.nm { display: block; font-size: 13px; letter-spacing: .03em; text-transform: uppercase; margin-bottom: 2px; }"
  ].join("\n"));
  CH.addKind("hub", function (spec, seed, mode) {
    var api = {}, nodes = spec.nodes || [], seen = {}, pick = null;
    var box = el("div", "lw bz bz-hub");
    var W = 560, H = 372, cx = W / 2, cy = 172, R = 118;
    var svg = svgRoot(W, H, "");
    svg.setAttribute("aria-label", (spec.center && spec.center.name || "The center") + " and " + nodes.length + " groups around it");
    box.appendChild(svg);
    var card = el("div", "bz-hb-card");
    box.appendChild(card);
    var spokes = S("g", {}, svg);
    var ctr = spec.center || { i: "store", name: "The company" };
    S("circle", { cx: cx, cy: cy, r: 58, class: "bz-hb-c" }, svg);
    iconAt(svg, ctr.i || "store", cx, cy - 10, 34, "k-yellow");
    S("text", { x: cx, y: cy + 26, "text-anchor": "middle", class: "bz-hb-lab" }, svg).textContent = ctr.name;
    var els = nodes.map(function (nd, k) {
      var a = -Math.PI / 2 + k * 2 * Math.PI / nodes.length;
      var x = cx + Math.cos(a) * R * 1.55, y = cy + Math.sin(a) * R;
      var sp = S("line", { x1: cx, y1: cy, x2: x, y2: y, class: "bz-hb-spoke k-" + (nd.c || "blue") }, spokes);
      var g = S("g", { class: "bz-hb-n k-" + (nd.c || "blue"), tabindex: 0, role: "button", "aria-label": nd.name }, svg);
      S("circle", { cx: x, cy: y, r: 34 }, g);
      iconAt(g, nd.i || "person", x, y - 1, 30, "");
      var ly = y + 52;
      S("text", { x: x, y: ly, "text-anchor": "middle", class: "bz-hb-lab" }, g).textContent = nd.name;
      g.addEventListener("click", function () { tap(k); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(k); } });
      return { g: g, sp: sp };
    });
    function tap(k) { pick = k; seen[k] = true; paint(); }
    function paint() {
      els.forEach(function (o, k) { o.g.classList.toggle("on", k === pick); o.g.classList.toggle("seen", !!seen[k]); o.sp.classList.toggle("on", k === pick); });
      var n = Object.keys(seen).length;
      card.innerHTML = pick != null ? '<b class="nm k-' + (nodes[pick].c || "blue") + '">' + esc(nodes[pick].name) + "</b>" + (nodes[pick].t || "") +
          (mode.explore && spec.gate && n < nodes.length ? ' <span class="k-muted">(' + n + " of " + nodes.length + ")</span>" : "")
        : (mode.explore ? "Tap each circle." : "Tap the one the question describes.");
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore ? (spec.gate ? Object.keys(seen).length >= nodes.length : true) : pick != null; };
    api.check = function () {
      var key = pick != null ? nodes[pick].key : null, ok = key === spec.answer;
      return { ok: ok, say: ok ? null : (spec.fb && spec.fb[key] && fmt(spec.fb[key])) || "Not that group — who is the question about?" };
    };
    api.reveal = function () {
      nodes.forEach(function (x, i) { seen[i] = true; });
      var k = nodes.map(function (x) { return x.key; }).indexOf(spec.answer);
      tap(k < 0 ? 0 : k);
    };
    return api;
  });

  window.OPLO_LAB.bizkitReady = true;
})();
