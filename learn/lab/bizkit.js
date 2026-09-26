/* ==========================================================================
   OEdu Lab — the business kit. See lab/core.js (COURSE_KIT) and lab/widgets.js.

   Loaded after the manipulatives and before any Introduction to Business
   unit. Every scene here is a step kind like the math ones: it returns
   { el, ready, check, reveal } and runs as a problem, or, on an idea card,
   as something to explore that can hold Continue until the move that shows
   the idea has been made.

     flip        cards you turn over one at a time: a picture and a name on
     the         front, what it means on the back
     chain       a cause and its effects, one link at a time
     amount      a number typed the way business writes it: 1,250 · $1,250 ·
     -$40        · 4.5% — commas are thousands, never decimals
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
    function show() { val.innerHTML = o.show ? fmt(o.show(+input.value)) : m(num(+input.value)); }
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
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>'
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
             credit: "Marco Verch / Flickr, CC BY 2.0" }
  };
  var PHOTO_DIR = "media/biz/u01/";
  /* photo("rubicon", "Team Rubicon trains volunteers for disaster relief.") → a <figure> for `art`. */
  function photo(key, caption, o) {
    var p = PHOTOS[key];
    if (!p) return "";
    o = o || {};
    return '<figure class="bz-photo' + (o.tall ? " tall" : "") + '"><img src="' + PHOTO_DIR + p.src + '" alt="' + esc(o.alt || p.alt) +
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

  window.OPLO_LAB.bizkitReady = true;
})();
