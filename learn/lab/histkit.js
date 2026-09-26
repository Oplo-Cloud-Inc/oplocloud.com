/* ==========================================================================
   OEdu Lab — the history kit. See lab/core.js (COURSE_KIT) and lab/widgets.js.

   Loaded after the manipulatives and before any Global History I unit.
   Every scene here is a step kind like the math ones: it returns
   { el, ready, check, reveal } and runs as a problem, or, on an idea card,
   as something to explore that can hold Continue until the move that shows
   the idea has been made. A reading page is a scene too: paragraphs,
   pictures, sources and definitions, with words you can tap open.

     turn        cards you turn over one at a time: a picture and a name on
     the         front, what it means on the back
     unfold      a cause and its effects, one link at a time
     years       a whole number typed the way a person writes it — "2,000",
     "2000       years" and "15th" all read as the number they mean
     page        a reading page — paragraphs, pictures, primary sources,
     definitions — with words and phrases that open when tapped
     yearline    the line of years around 1 BCE | 1 CE: drag a marker across
     it,         count the years between two dates, or find a century
     timeline    flags on a line of years: tap them to read about each event,
     or,         as a problem, drag each flag to its date
     truesize    a Mercator map: drag Greenland toward the equator and it
     shrinks     to its true size beside Africa
     layers      Hagia Sophia through time: step through its four lives
     and         watch what each one added to the building
     probe       a source and the four questions that turn it into
     evidence    — author, audience, intent, context — opened one
     at          a time
     tone        a sentence with words you can swap, and a meter that shows
     how         the swap changes its force — rhetoric you can feel
     causes      a pyramid of causes — primary (the spark) at the top,
     secondary   below it, tertiary (the broad context) at the
     base:       tap it open, or sort causes into it
     lens        one past, six historians: pick a lens and see what it
     brings      into focus in a colonial town, and what it asks
   Everything a unit needs is on L.H, and nowhere else, so this kit and the
   business kit can both be loaded without either replacing the other's
   helpers: H.icon and H.card (line pictures for cards), H.tiles (a row of
   pictures), H.photo (the course's photographs, each with its credit) and
   H.read (a reading page as a lesson step).

   Built from the history build folder (kit/*.js) by assemble.py.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_LAB || !window.OPLO_CHALLENGE) return;

  /* =============================================================== Parts
     What every history scene is built from: the widgets' own helpers
     (lab/widgets.js), a frame for a drawing, a live line of words, and the
     course's pictures. Everything is kept on L.H so this kit never replaces
     what the business kit puts on L. */
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
     Years as a history book writes them. A year is a signed number here —
     −44 is 44 BCE, 1453 is 1453 CE — because that is what makes counting
     across the line possible; there is no year zero, so 1 BCE is followed
     directly by 1 CE.
       year(-44) → "44 BCE", year(1453) → "1453 CE", year(1453, true) → "1453"
       span(-44, 14) → 57 (years from one to the other, with no year zero)
       century(1453) → 15, century(-490) → 5, nth(15) → "15th" */
  function commas(s) { return String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function count(v) { return commas(String(Math.round(v))); }            // 12500 → "12,500"
  function year(y, bare) {
    // A date takes no comma (1754 BCE); only a five-figure one does (10,000 BCE).
    var a = Math.abs(y), n = a >= 10000 ? commas(a) : String(a);
    return y < 0 ? n + " BCE" : n + (bare ? "" : " CE");
  }
  function span(a, b) {
    var lo = Math.min(a, b), hi = Math.max(a, b);
    return hi - lo - (lo < 0 && hi > 0 ? 1 : 0);
  }
  function century(y) { return y > 0 ? Math.floor((y - 1) / 100) + 1 : Math.floor((-y - 1) / 100) + 1; }
  function nth(n) {
    var t = n % 100, u = n % 10;
    return n + (t >= 11 && t <= 13 ? "th" : u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th");
  }
  function round(v, dp) { var k = Math.pow(10, dp || 0); return Math.round(v * k) / k; }

  /* ----------------------------------------------------------------- Style
     Each scene adds its rules once, into one <style> of the kit's own. All
     colour comes from tokens (--lw-* from lab.css, --ink/--paper/... from the
     app), so a scene reads the same on the light console and on Obsidian. */
  var styleEl = null;
  function css(text) {
    if (!styleEl) {
      var old = document.getElementById("histkit-css");
      if (old) old.parentNode.removeChild(old);
      styleEl = document.createElement("style");
      styleEl.id = "histkit-css";
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
    var svg = svgRoot(w, h, "hk-chart " + (o.cls || ""));
    var x0 = p[3], x1 = w - p[1], y0 = h - p[2], y1 = p[0];
    function X(v) { return x0 + (v - o.x[0]) / (o.x[1] - o.x[0]) * (x1 - x0); }
    function Y(v) { return y0 - (v - o.y[0]) / (o.y[1] - o.y[0]) * (y0 - y1); }
    function iX(px) { return o.x[0] + (px - x0) / (x1 - x0) * (o.x[1] - o.x[0]); }
    function iY(py) { return o.y[0] + (y0 - py) / (y0 - y1) * (o.y[1] - o.y[0]); }
    var ax = S("g", { class: "hk-axes" }, svg);
    (o.yticks || []).forEach(function (v) {
      if (o.grid !== false) S("line", { x1: x0, x2: x1, y1: Y(v), y2: Y(v), class: "hk-grid" }, ax);
      S("text", { x: x0 - 8, y: Y(v) + 4, class: "hk-tick", "text-anchor": "end" }, ax).textContent = o.yfmt ? o.yfmt(v) : String(v);
    });
    (o.xticks || []).forEach(function (v) {
      if (o.grid === "both") S("line", { x1: X(v), x2: X(v), y1: y0, y2: y1, class: "hk-grid" }, ax);
      S("text", { x: X(v), y: y0 + 18, class: "hk-tick", "text-anchor": "middle" }, ax).textContent = o.xfmt ? o.xfmt(v) : String(v);
    });
    S("line", { x1: x0, x2: x1, y1: y0, y2: y0, class: "hk-axis" }, ax);
    S("line", { x1: x0, x2: x0, y1: y0, y2: y1, class: "hk-axis" }, ax);
    if (o.xlabel) S("text", { x: (x0 + x1) / 2, y: h - 6, class: "hk-alabel", "text-anchor": "middle" }, ax).textContent = o.xlabel;
    if (o.ylabel) S("text", { x: 0, y: 0, class: "hk-alabel", "text-anchor": "middle",
                              transform: "translate(15," + (y0 + y1) / 2 + ") rotate(-90)" }, ax).textContent = o.ylabel;
    var plot = S("g", { class: "hk-plot" }, svg), over = S("g", { class: "hk-over" }, svg);
    return { svg: svg, plot: plot, over: over, X: X, Y: Y, iX: iX, iY: iY, w: w, h: h, pad: p,
             left: x0, right: x1, top: y1, bottom: y0 };
  }

  /* ------------------------------------------------------------- Controls */
  // A live line of words under a scene, read out to a screen reader.
  function readout(cls) {
    var r = el("div", "hk-read " + (cls || ""));
    r.setAttribute("role", "status");
    r.setAttribute("aria-live", "polite");
    return r;
  }
  // A row of big numbers: kpis([{ k: "rev", label: "Revenue", color: "blue" }, …]) → { el, set(k, html, tone) }.
  function kpis(list) {
    var row = el("div", "hk-kpis"), cells = {};
    list.forEach(function (x) {
      var c = el("div", "hk-kpi" + (x.color ? " k-" + x.color : ""));
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
    var box = el("div", "hk-seg"), val = cur;
    box.setAttribute("role", "group");
    var btns = items.map(function (it) {
      var b = button("hk-segb", it.label);
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
     icon("scroll") → an <svg> string for cards, tiles and prompts;
     iconAt(g, "scroll", x, y, size, cls) puts one inside a scene's drawing. */
  var ICONS = {
    scroll: '<path d="M6 4h11a2 2 0 0 1 0 4h-2"/><path d="M15 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1 0-4h8"/><path d="M6 4a2 2 0 0 0-2 2v10"/><path d="M8 9h4M8 12h4"/>',
    quill: '<path d="M20 4C13 5 8 10 7 17l-2 3"/><path d="M20 4c-1 5-4 9-10 11"/><path d="M11 11 9 13"/>',
    book: '<path d="M4 4.5h6.5A2.5 2.5 0 0 1 13 7v12a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6.5A2.5 2.5 0 0 0 11 7v12a2 2 0 0 1 2-2h7z"/>',
    diary: '<path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M4 18a2 2 0 0 1 2-2h12"/><path d="M13 3v6l-2-1.5L9 9V3"/>',
    letter: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    news: '<rect x="3" y="4.5" width="15" height="15" rx="1.5"/><path d="M18 8h2.5v9.5a2 2 0 0 1-4 0V8M6.5 8.5h8M6.5 12h8M6.5 15.5h5"/>',
    web: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 9h18"/><circle cx="6" cy="6.8" r=".6"/><circle cx="8.3" cy="6.8" r=".6"/><path d="M7 13h10M7 16h6"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9"/><path d="M10 13h4"/>',
    painting: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="8.5" r="1.5"/>',
    camera: '<path d="M3 8h4l2-2.5h6L17 8h4v11H3z"/><circle cx="12" cy="13.5" r="3.5"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    radio: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l10-5"/><circle cx="15.5" cy="14" r="3"/><path d="M6 12h4M6 15h4"/>',
    quote: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    ear: '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5.5 1.5"/><path d="M10 10a2 2 0 0 1 4 0c0 1.5-2 2-2 3.5"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    column: '<path d="M4 20h16M5 17h14M6 7h12M5 4h14"/><path d="M8 7v10M12 7v10M16 7v10"/>',
    museum: '<path d="M3 21h18M4 18h16M12 3 3 8h18z"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8"/>',
    capitol: '<path d="M4 21h16M5 18h14M7 18v-6M11 18v-6M13 18v-6M17 18v-6M5 12h14"/><path d="M8 12a4 4 0 0 1 8 0"/><path d="M12 8V4"/>',
    church: '<path d="M12 2.5v4M10 4.5h4"/><path d="M6 21v-9l6-5 6 5v9z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
    mosque: '<path d="M3 20h18"/><path d="M7 20v-6h10v6"/><path d="M7 14a5 5 0 0 1 10 0"/><path d="M12 9V6.5"/><path d="M4 20V9l1-2 1 2v11M18 20V9l1-2 1 2v11"/>',
    dome: '<path d="M4 20h16"/><path d="M6 20v-7h12v7"/><path d="M6 13a6 6 0 0 1 12 0"/><path d="M12 7V4"/><path d="M10 20v-4h4v4"/>',
    pyramid: '<path d="M2.5 20 12 4l9.5 16z"/><path d="M12 4l3 16"/>',
    vase: '<path d="M9 3h6M10 3v3c-3 1.5-4 4-4 7 0 4 3 7 6 8 3-1 6-4 6-8 0-3-1-5.5-4-7V3"/><path d="M7 11h10"/>',
    bust: '<circle cx="12" cy="8" r="4"/><path d="M6 21v-2a6 6 0 0 1 12 0v2z"/>',
    crown: '<path d="M4 18h16l1-11-5 4-4-6-4 6-5-4z"/><path d="M4 21h16"/>',
    sword: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/>',
    gavel: '<path d="M14 4l6 6M11.5 6.5l6 6M13 5l-4 4 6 6 4-4"/><path d="M10 11 3.5 17.5a1.5 1.5 0 0 0 2 2L12 13"/><path d="M13 21h8"/>',
    scale: '<path d="M12 3v18M7 21h10M4 7h16"/><path d="M4 7l-2.5 6a3 3 0 0 0 5 0zM20 7l-2.5 6a3 3 0 0 0 5 0z"/>',
    coin: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="2.6"/><path d="M3 7v4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7"/><path d="M9 13.6v3c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4c0-1.2-2-2.2-4.6-2.5"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
    ship: '<path d="M3 17l2 4h14l2-4z"/><path d="M5 17v-6h14v6"/><path d="M9 11V6h6v5"/>',
    anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 10h8"/><path d="M4 13a8 8 0 0 0 16 0"/>',
    plane: '<path d="M21.5 3 2.5 10.5l7 2.5 2.5 7z"/><path d="M21.5 3 9.5 13"/>',
    person: '<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 4.8"/>',
    worker: '<path d="M5 12a7 7 0 0 1 14 0"/><path d="M3.5 12h17"/><path d="M12 5v3"/><path d="M7 15a5 5 0 0 0 10 0"/>',
    house: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    mine: '<path d="M2.5 20 9 8l4 7 2.5-4 6 9z"/><path d="M8 20v-3.5h3V20"/>',
    wheat: '<path d="M12 21V8"/><path d="M12 12c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 12c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 16.5c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 16.5c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 8c-1.5-1-1.5-3.5 0-5 1.5 1.5 1.5 4 0 5z"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5"/>',
    basket: '<path d="M3 10h18l-2 10H5z"/><path d="M8 10l3-6M16 10l-3-6M9 14v3M12 14v3M15 14v3"/>',
    ring: '<circle cx="12" cy="14.5" r="6"/><path d="M9.5 4h5L12 8z"/>',
    hammer: '<path d="M13 7 4 16a2 2 0 0 0 3 3l9-9"/><path d="M11 5l4-2 6 6-2 4z"/>',
    factory: '<path d="M3 20V10l5 3V10l5 3V10l5 3V4h3v16z"/><path d="M7 17h2M12 17h2"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    cap: '<path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    layers: '<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M2.5 12 12 17l9.5-5"/><path d="M2.5 16 12 21l9.5-5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    flame: '<path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7 10 6 12.5 6 15a6 6 0 0 0 6 6z"/>',
    bolt: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    tree: '<path d="M12 21v-5"/><path d="M12 3 6 12h3l-4 5h14l-4-5h3z"/>',
    mountain: '<path d="M2.5 20 9 8l4 7 2.5-4 6 9z"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 8.5a4.8 4.8 0 0 1-.5 9.5z"/>',
    snow: '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6"/><path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    heart: '<path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10z"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 21h8M9.5 17h5v4h-5z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    megaphone: '<path d="M3 10v4h3l8 5V5L6 10z"/><path d="M17.5 9a4 4 0 0 1 0 6M20 6.5a8 8 0 0 1 0 11"/>',
    alliance: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
    warn: '<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17v.5"/>',
    check: '<path d="M4 12.5 9.5 18 20 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".6"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    up: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>'
  };
  function icon(name, cls) {
    var p = ICONS[name] || ICONS.question;
    return '<svg class="hk-ic ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"' +
           ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>";
  }
  function iconAt(g, name, x, y, size, cls) {
    var k = (size || 24) / 24;
    var n = S("g", { transform: "translate(" + (x - (size || 24) / 2) + "," + (y - (size || 24) / 2) + ") scale(" + k + ")",
                     class: "hk-gic " + (cls || ""), fill: "none", stroke: "currentColor", "stroke-width": 1.8 / Math.max(k, 0.6),
                     "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    n.innerHTML = ICONS[name] || ICONS.question;
    return n;
  }
  /* A sort or choice card with its picture: card("letter", "A letter home"). */
  function card(name, text) { return '<span class="hk-card">' + icon(name) + "<span>" + text + "</span></span>"; }
  /* A row of pictures with a word under each, for an idea card's `art`:
     tiles([{ i: "scroll", t: "A treaty" }, { i: "vase", t: "A pot", c: "orange" }]). */
  function tiles(list, cap) {
    return '<figure class="hk-tiles">' + '<div class="hk-trow">' + list.map(function (x) {
      return '<div class="hk-tile' + (x.c ? " k-" + x.c : "") + '">' + icon(x.i) + "<span>" + x.t + "</span></div>";
    }).join("") + "</div>" + (cap ? "<figcaption>" + cap + "</figcaption>" : "") + "</figure>";
  }

  /* Photographs, each with where it came from. They are the textbook's
     (OpenStax, World History Volume 1), whose pictures carry their own open
     licences; the credit is shown under every one. */
  var PHOTOS = {
    worldmap: { src: "world-map.jpg", w: 1200, h: 714,
                alt: "An old world map drawn as two circles, one for each half of the globe, framed by decorated corners and Latin titles.",
                credit: "Library of Congress / Wikimedia Commons, public domain" },
    eleanor: { src: "eleanor-udhr.jpg", w: 1019, h: 800,
               alt: "Eleanor Roosevelt holds up a large poster of the Universal Declaration of Human Rights.",
               credit: "FDR Presidential Library & Museum / Flickr, CC BY 2.0" },
    hagiaold: { src: "hagia-drawing.jpg", w: 900, h: 522,
                alt: "A drawing of Hagia Sophia's outside: a great central dome over half-domes and arched walls, with no towers.",
                credit: "ETH Library / Wikimedia Commons, public domain" },
    mosaic: { src: "hagia-mosaic.jpg", w: 1000, h: 641,
              alt: "A gold mosaic of Mary holding the child Jesus between two emperors, one offering a model of a church and one a model of a city.",
              credit: "Myrabella / Wikimedia Commons, CC0 1.0" },
    hagianow: { src: "hagia-today.jpg", w: 900, h: 604,
                alt: "Hagia Sophia at dusk, its dome lit up, with four tall, thin minarets rising at its corners.",
                credit: "Frank Mago / Flickr, CC BY 2.0" },
    hagiain: { src: "hagia-interior.jpg", w: 1000, h: 675,
               alt: "Inside Hagia Sophia: arches and windows under the dome, with huge round medallions carrying Arabic writing.",
               credit: "Karelj / Wikimedia Commons, public domain" },
    pearl: { src: "pearl-harbor.jpg", w: 1125, h: 800,
             alt: "A black-and-white photo taken from a plane above Pearl Harbor, with smoke rising from ships in the harbor.",
             credit: "Naval History and Heritage Command / Wikimedia Commons, public domain" },
    achebe: { src: "achebe.jpg", w: 567, h: 849,
              alt: "A young Chinua Achebe, seated outdoors, holding a book.",
              credit: "The New York Times / Wikimedia Commons, public domain" }
  };
  var PHOTO_DIR = "media/hist/u01/";
  /* photo("pearl", "Pearl Harbor, seen from a Japanese plane.") → a <figure> for `art`.
     o: { tall, small, alt } */
  function photo(key, caption, o) {
    var p = PHOTOS[key];
    if (!p) return "";
    o = o || {};
    return '<figure class="hk-photo' + (o.tall ? " tall" : "") + (o.small ? " small" : "") + '"><img src="' + (p.dir || PHOTO_DIR) + p.src + '" alt="' + esc(o.alt || p.alt) +
      '" width="' + p.w + '" height="' + p.h + '" loading="lazy" decoding="async">' +
      "<figcaption>" + (caption ? "<span>" + caption + "</span>" : "") + "<small>Photo: " + esc(p.credit) + "</small></figcaption></figure>";
  }

  /* ------------------------------------------------------------ Rich text
     Lesson text, formatted the lab's way (**bold**, *em*), with words the
     reader can tap open: "[[primary source|Something made at the time you
     are studying.]]" shows "primary source" underlined, and tapping it opens
     what it means. rich() returns { html, notes } — the notes by number, for
     whoever shows them. */
  var TERM = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  function rich(text, notes) {
    notes = notes || [];
    var html = String(text == null ? "" : text).replace(TERM, function (_, word, note) {
      notes.push(fmt(note));
      return '<button type="button" class="hk-term" data-n="' + (notes.length - 1) + '" aria-expanded="false">' + fmt(word) + "</button>";
    });
    return { html: fmt(html), notes: notes };
  }
  function plain(text) { return String(text == null ? "" : text).replace(TERM, "$1"); }

  /* ------------------------------------------------------------ Random bits
     For generators: n different things from a list, in a random order. */
  function sample(R, arr, n) { return R.shuffle(arr.slice()).slice(0, n); }

  /* A reading page as a lesson step:
       read({ title, blocks, kicker, gate, then, after })
     blocks are drawn by the "page" scene (see kit/08-page.js). */
  function read(o) {
    var st = { type: "learn", kicker: o.kicker || "Read", prompt: o.title,
               scene: { type: "page", blocks: o.blocks || [], gate: !!o.gate, wide: !!o.wide } };
    if (o.gate) st.gate = true;
    if (o.then) st.then = o.then;
    if (o.after) st.after = o.after;
    return st;
  }

  Object.assign(B, {
    S: S, svgRoot: svgRoot, svgPt: svgPt, clamp: clamp, snapTo: snapTo, draggable: draggable, slider: slider, note: note,
    commas: commas, count: count, year: year, span: span, century: century, nth: nth, round: round,
    css: css, reduced: reduced, tween: tween, chart: chart, readout: readout, kpis: kpis, seg: seg, btn: btn,
    icon: icon, iconAt: iconAt, card: card, tiles: tiles, photo: photo, rich: rich, plain: plain, sample: sample, read: read,
    ICONS: ICONS, PHOTOS: PHOTOS
  });
  // For unit files: everything on L.H, and nothing else on L.
  LAB.H = B;

  css([
    ".hk { gap: 14px; }",
    ".hk .lw-svg text { font-family: var(--text); }",
    ".hk-stage { position: relative; border-radius: 18px; background: var(--lw-surface); padding: 10px 12px; }",
    ".hk-tick { font-size: 12px; fill: var(--ink-2); font-variant-numeric: tabular-nums; }",
    ".hk-alabel { font-size: 13px; fill: var(--ink-2); font-weight: 600; letter-spacing: .01em; }",
    ".hk-axis { stroke: var(--lw-axis); stroke-width: 1.5; }",
    ".hk-grid { stroke: var(--lw-grid); stroke-width: 1; }",
    ".hk-read { font-size: 16px; line-height: 1.45; color: var(--ink); text-align: center; min-height: 24px; }",
    ".hk-read b { font-weight: 650; }",
    ".hk-read .up, .hk .good { color: var(--lw-green); } .hk-read .dn, .hk .bad { color: var(--lw-red); }",
    ".hk-kpis { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }",
    ".hk-kpi { min-width: 118px; padding: 10px 16px; border-radius: 14px; background: var(--lw-surface); text-align: center; }",
    ".hk-kpi small { display: block; font-size: 12.5px; color: var(--ink-2); margin-bottom: 2px; }",
    ".hk-kpi b { font-size: 22px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--ink); }",
    ".hk-kpi.good b { color: var(--lw-green); } .hk-kpi.bad b { color: var(--lw-red); }",
    ".hk-seg { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 4px; border-radius: 13px; background: var(--lw-surface); }",
    ".hk-segb { border: 0; background: transparent; color: var(--ink-2); font: inherit; font-size: 14.5px; padding: 7px 14px; border-radius: 10px; cursor: pointer; }",
    ".hk-segb:hover { color: var(--ink); }",
    ".hk-segb.on { background: var(--paper); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,.12); font-weight: 600; }",
    "html[data-look=\"obsidian\"] .hk-segb.on { background: rgba(255,255,255,.1); }",
    ".hk-ic { width: 1.25em; height: 1.25em; flex: none; vertical-align: -.25em; }",
    ".hk-card { display: inline-flex; align-items: center; gap: 9px; text-align: left; }",
    ".hk-card .hk-ic { width: 22px; height: 22px; color: var(--lw-blue); }",
    ".hk-tiles { margin: 4px 0 0; }",
    ".hk-trow { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }",
    ".hk-tile { display: grid; justify-items: center; gap: 6px; min-width: 96px; padding: 14px 12px 10px; border-radius: 16px; background: var(--lw-surface, var(--canvas)); color: var(--lw-blue); }",
    ".hk-tile .hk-ic { width: 34px; height: 34px; }",
    ".hk-tile span { font-size: 13.5px; color: var(--ink); text-align: center; max-width: 120px; line-height: 1.3; }",
    ".hk-tiles figcaption, .hk-photo figcaption { margin-top: 8px; font-size: 14px; color: var(--ink-2); display: grid; gap: 3px; text-align: center; }",
    ".hk-photo { margin: 0; }",
    ".hk-photo img { display: block; width: 100%; height: auto; max-height: 300px; object-fit: cover; border-radius: 16px; background: var(--lw-surface, var(--canvas)); }",
    ".hk-photo.tall img { max-height: 400px; width: auto; max-width: 100%; margin: 0 auto; object-fit: contain; }",
    ".hk-photo.small img { max-height: 260px; width: auto; max-width: 100%; margin: 0 auto; object-fit: contain; }",
    ".hk-photo figcaption small { font-size: 11.5px; color: var(--ink-2); opacity: .75; }",
    ".k-blue { color: var(--lw-blue); } .k-red { color: var(--lw-red); } .k-green { color: var(--lw-green); }",
    ".k-yellow { color: var(--lw-yellow); } .k-orange { color: var(--lw-orange); } .k-purple { color: var(--lw-purple); } .k-muted { color: var(--ink-2); }",
    ".hk .f-blue { fill: var(--lw-blue); } .hk .f-red { fill: var(--lw-red); } .hk .f-green { fill: var(--lw-green); }",
    ".hk .f-yellow { fill: var(--lw-yellow); } .hk .f-orange { fill: var(--lw-orange); } .hk .f-purple { fill: var(--lw-purple); }",
    ".hk .f-ink { fill: var(--ink); } .hk .f-muted { fill: var(--ink-2); } .hk .f-surface { fill: var(--lw-surface); } .hk .f-tile { fill: var(--lw-tile); } .hk .f-paper { fill: var(--paper); }",
    ".hk .s-blue { stroke: var(--lw-blue); } .hk .s-red { stroke: var(--lw-red); } .hk .s-green { stroke: var(--lw-green); }",
    ".hk .s-yellow { stroke: var(--lw-yellow); } .hk .s-orange { stroke: var(--lw-orange); } .hk .s-purple { stroke: var(--lw-purple); }",
    ".hk .s-ink { stroke: var(--ink); } .hk .s-muted { stroke: var(--ink-2); }",
    ".hk-lbl { font-size: 13px; fill: var(--ink); font-weight: 600; }",
    ".hk-lbl.sm { font-size: 11.5px; font-weight: 500; fill: var(--ink-2); }",
    ".hk-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }",
    /* A word the reader can tap open, wherever rich text is shown. */
    ".hk-term { display: inline; padding: 0 1px; margin: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer;",
    "  text-decoration: underline; text-decoration-style: dotted; text-decoration-thickness: 2px; text-underline-offset: 4px; text-decoration-color: var(--lw-orange); border-radius: 4px; }",
    ".hk-term:hover, .hk-term[aria-expanded=\"true\"] { background: color-mix(in srgb, var(--lw-orange) 16%, transparent); }",
    ".hk-term.seen { text-decoration-style: solid; text-decoration-thickness: 1.5px; }",
    ".hk-term:focus-visible { outline: 2px solid var(--blue); outline-offset: 1px; }"
  ].join("\n"));

  /* ================================================================= Turn
     //: turn       cards you turn over one at a time: a picture and a name on
     //:            the front, what it means on the back
     A handful of related ideas met one at a time instead of as a list: each
     card shows a picture and a name, and turning it shows the idea in a
     sentence or two. With gate, Continue waits until every card has been
     turned.
       spec: { cards: [{ i: "scroll", name: "Primary source", t: "…", c: "blue" }, …],
               cols: 2 | 3 | 4, gate }
     `t` (the back) is lesson text — the lab formats it before it gets here,
     `name` is plain. As a problem it asks for
     nothing and is always ready. */
  B.css([
    ".hk-flips { display: grid; gap: 12px; }",
    ".hk-flip { position: relative; min-height: 132px; border: 0; padding: 0; background: none; cursor: pointer; perspective: 900px; font: inherit; text-align: left; }",
    ".hk-flip-in { position: relative; display: block; height: 100%; min-height: 132px; transition: transform .45s cubic-bezier(.2,.7,.2,1); transform-style: preserve-3d; }",
    ".hk-flip.on .hk-flip-in { transform: rotateY(180deg); }",
    ".hk-flip-f, .hk-flip-b { display: grid; align-content: center; gap: 8px; padding: 14px 16px; border-radius: 18px; min-height: 132px; box-sizing: border-box;",
    "  background: var(--lw-surface); backface-visibility: hidden; -webkit-backface-visibility: hidden; box-shadow: inset 0 0 0 1.5px var(--lw-grid); }",
    ".hk-flip-f { position: absolute; inset: 0; justify-items: center; text-align: center; }",
    ".hk-flip-f .hk-ic { width: 38px; height: 38px; }",
    ".hk-flip-f b { font-size: 16.5px; color: var(--ink); font-weight: 650; }",
    ".hk-flip-f small { font-size: 12px; color: var(--ink-2); }",
    ".hk-flip-b { position: relative; transform: rotateY(180deg); font-size: 15px; line-height: 1.45; color: var(--ink); }",
    ".hk-flips.tight .hk-flip-b { font-size: 13.5px; padding: 12px 12px; }",
    ".hk-flip-b b.nm { font-size: 13px; letter-spacing: .02em; text-transform: uppercase; color: var(--ink-2); font-weight: 650; }",
    ".hk-flip:focus-visible .hk-flip-f, .hk-flip:focus-visible .hk-flip-b { box-shadow: inset 0 0 0 2.5px var(--blue); }",
    ".hk-flip.on .hk-flip-b { box-shadow: inset 0 0 0 1.5px currentColor; }",
    "@media (prefers-reduced-motion: reduce) { .hk-flip-in { transition: none; } }"
  ].join("\n"));
  CH.addKind("turn", function (spec, seed, mode) {
    var api = {}, cards = spec.cards || [], turned = {};
    var box = el("div", "lw hk hk-flipw");
    var grid = el("div", "hk-flips");
    var cols = spec.cols || Math.min(cards.length, cards.length === 4 ? 2 : 3);
    grid.style.gridTemplateColumns = "repeat(" + cols + ", minmax(0, 1fr))";
    if (cols >= 4) grid.classList.add("tight");
    box.appendChild(grid);
    var left = readout("hk-flip-read");
    box.appendChild(left);
    cards.forEach(function (c, k) {
      var b = button("hk-flip k-" + (c.c || "blue"),
        '<span class="hk-flip-in">' +
          '<span class="hk-flip-f">' + icon(c.i || "question") + "<b>" + esc(c.name) + "</b><small>Tap to turn over</small></span>" +
          '<span class="hk-flip-b"><b class="nm">' + esc(c.name) + "</b><span>" + (c.t || "") + "</span></span>" +
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

  /* ================================================================ Unfold
     //: unfold     a cause and its effects, one link at a time
     History is mostly "this, so that": one change sets off the next. A
     chain shows the first link, and "What happens next?" adds the next one,
     with an arrow and its reason, so the student follows the ripple instead
     of reading a finished list. With gate, Continue waits for the last link.
       spec: { steps: [{ i: "ship", t: "Traders reach a new port.", c: "blue" }, …],
               start: 1, next: "What happens next?" }
     Each `t` is lesson text (formatted by the lab). */
  B.css([
    ".hk-chain { list-style: none; margin: 0; padding: 4px 0; display: grid; gap: 0; }",
    ".hk-link { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: center; padding: 10px 14px; border-radius: 16px; background: var(--lw-surface); }",
    ".hk-link.in { animation: hk-rise .35s cubic-bezier(.2,.7,.2,1) both; }",
    ".hk-link .hk-lk-ic { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 13px; background: color-mix(in srgb, currentColor 13%, transparent); }",
    ".hk-link .hk-ic { width: 24px; height: 24px; }",
    ".hk-link .hk-lk-t { font-size: 16px; line-height: 1.45; color: var(--ink); }",
    ".hk-arrow { display: grid; place-items: center; height: 26px; color: var(--ink-2); }",
    ".hk-arrow svg { width: 16px; height: 16px; }",
    "@keyframes hk-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }",
    "@media (prefers-reduced-motion: reduce) { .hk-link.in { animation: none; } }"
  ].join("\n"));
  CH.addKind("unfold", function (spec, seed, mode) {
    var api = {}, steps = spec.steps || [], k = Math.min(steps.length, spec.start || 1);
    var box = el("div", "lw hk hk-chainw");
    var list = el("ol", "hk-chain");
    box.appendChild(list);
    var go = btn(esc(spec.next || "What happens next?"), "hk-chain-next");
    var tools = el("div", "lw-tools");
    tools.appendChild(go);
    box.appendChild(tools);
    var DOWN = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v11M3.5 8.5 8 13l4.5-4.5"/></svg>';
    function add(s, i, fresh) {
      if (i > 0) list.appendChild(el("li", "hk-arrow", DOWN)).setAttribute("aria-hidden", "true");
      var li = el("li", "hk-link k-" + (s.c || "blue") + (fresh && !B.reduced() ? " in" : ""));
      li.innerHTML = '<span class="hk-lk-ic">' + icon(s.i || "arrow") + '</span><span class="hk-lk-t">' + (s.t || "") + "</span>";
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

  /* ================================================================= Years
     //: years      a whole number typed the way a person writes it — "2,000",
     //:            "2000 years" and "15th" all read as the number they mean
     The lab's own number box reads a comma as a decimal point (right for
     "2,5", wrong for a span of 2,000 years), so a history answer is typed
     here instead.
       spec: { answer, unit: "years", tol, shown, near: [{ v, fb, tol }] }
     `near` holds the likely slips, each with its own reply. */
  B.css([
    ".hk-years input { font-variant-numeric: tabular-nums; }"
  ].join("\n"));
  function yearsRead(t) {
    t = String(t == null ? "" : t).trim().toLowerCase().replace(/−/g, "-")
      .replace(/\s*(years?|yrs?|centur(y|ies)|ce|ad|bce|bc)\.?$/, "")
      .replace(/(\d)(st|nd|rd|th)$/, "$1")
      .replace(/(\d)[,\s](?=\d{3}(\D|$))/g, "$1")
      .replace(/\s+/g, "");
    return /^-?\d+$/.test(t) ? parseInt(t, 10) : NaN;
  }
  CH.addKind("years", function (s) {
    var api = {};
    var wrap = el("label", "ch-num hk-years");
    var inp = el("input");
    inp.type = "text";
    inp.inputMode = "numeric";
    inp.autocomplete = "off";
    inp.setAttribute("aria-label", s.label || "Your answer");
    wrap.appendChild(inp);
    if (s.unit) wrap.appendChild(el("span", "ch-unit", esc(s.unit)));
    inp.addEventListener("input", function () { wrap.classList.remove("no"); if (api.onChange) api.onChange(); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && api.ready() && api.onEnter) api.onEnter(); });
    api.el = wrap;
    api.ready = function () { return isFinite(yearsRead(inp.value)); };
    api.check = function () {
      var v = yearsRead(inp.value);
      var ok = Math.abs(v - s.answer) <= (s.tol || 0);
      wrap.classList.toggle("no", !ok);
      if (ok) { wrap.classList.add("yes"); inp.disabled = true; }
      var near = (s.near || []).filter(function (n) { return Math.abs(v - n.v) <= (n.tol || 0); })[0];
      return { ok: ok, say: ok ? null : near ? near.fb : null };
    };
    api.reveal = function () { inp.value = s.shown || commas(s.answer); inp.disabled = true; wrap.classList.remove("no"); wrap.classList.add("yes"); };
    api.focus = function () { inp.focus(); };
    return api;
  });

  /* ================================================================== Page
     //: page       a reading page — paragraphs, pictures, primary sources,
     //:            definitions — with words and phrases that open when tapped
     A reading lesson is made of these, with a question between them. The
     textbook's voice is set in the app's own type; a primary source is set
     apart, in a book face, the way a document looks on a desk.
       spec: { blocks: [...], gate }
     A block is a string (a paragraph) or [kind, ...]:
       ["p", text]                        a paragraph
       ["h", text]                        a small heading
       ["def", term, meaning]             a definition card
       ["quote", text, who]               a pulled quote
       ["src", { title, who, when, i, text, cite }]
                                          a primary source; text is a string or
                                          a list of paragraphs
       ["pair", src, src]                 two sources side by side
       ["fig", photoKey, caption, { tall, small }]   a photograph
       ["figs", [key, caption], [key, caption]]      two in a row
       ["note", label, text]              an aside ("Real world", "Did you know?")
       ["list", title, [[name, text], …]] named things, one to a row
       ["stat", big, text]                a number worth stopping on
       ["tiles", [{ i, t, c }], caption]  a row of pictures
       ["ask", text]                      something to think about as you read
     Any text may carry [[word|what it means]] (or, in a source, [[phrase|a
     note on it]]): the word is underlined and opens its meaning beneath the
     block it sits in. With gate, Continue waits until each one is opened.
     Block text is formatted here, not by the lab (**bold**, *em*). */
  B.css([
    ".hk-page { display: grid; gap: 0; font-family: var(--text); font-size: 17.5px; line-height: 1.62; letter-spacing: -.008em; color: var(--ink); }",
    ".hk-page > * + * { margin-top: 16px; }",
    ".hk-page em { font-style: italic; color: inherit; }",
    ".hk-tip { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--ink-2); }",
    ".hk-tip .hk-ic { width: 17px; height: 17px; color: var(--lw-orange); }",
    ".hk-h { margin-top: 24px !important; font-family: var(--font); font-size: 18px; font-weight: 650; letter-spacing: -.012em; }",
    ".hk-def { padding: 16px 18px; border-radius: 15px; background: var(--paper); box-shadow: inset 0 0 0 1px var(--rule, var(--hair)); }",
    ".hk-def > b { display: block; font-family: var(--font); font-size: 16.5px; font-weight: 650; margin-bottom: 3px; color: var(--lw-blue); }",
    ".hk-def > span { display: block; font-size: 16px; line-height: 1.55; color: var(--ink); }",
    ".hk-quote { padding: 2px 0 2px 20px; border-left: 3px solid var(--ink); }",
    ".hk-quote p { font-family: var(--font); font-size: 21px; font-weight: 600; line-height: 1.3; letter-spacing: -.016em; }",
    ".hk-quote span { display: block; margin-top: 8px; font-size: 14.5px; line-height: 1.45; color: var(--ink-2); }",
    ".hk-src { padding: 16px 20px 18px; border-radius: 16px; background: var(--lw-surface); box-shadow: inset 0 0 0 1px var(--hair); }",
    ".hk-src-h { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 10px; }",
    ".hk-src-h .hk-ic { width: 26px; height: 26px; color: var(--lw-orange); margin-top: 2px; }",
    ".hk-src-h small { display: block; font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--lw-orange); }",
    ".hk-src-h b { display: block; font-family: var(--font); font-size: 16px; font-weight: 650; line-height: 1.35; }",
    ".hk-src-h i { display: block; font-style: normal; font-size: 13.5px; color: var(--ink-2); line-height: 1.4; }",
    ".hk-src-t { font-family: \"Iowan Old Style\", \"Palatino Linotype\", Palatino, \"Book Antiqua\", Georgia, serif; font-size: 17.5px; line-height: 1.6; letter-spacing: 0; }",
    ".hk-src-t p + p { margin-top: 10px; }",
    ".hk-src-t .hk-term { text-decoration-color: var(--lw-blue); }",
    ".hk-src-t .hk-term:hover, .hk-src-t .hk-term[aria-expanded=\"true\"] { background: color-mix(in srgb, var(--lw-blue) 16%, transparent); }",
    ".hk-src-c { margin-top: 10px; font-size: 13px; color: var(--ink-2); }",
    ".hk-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }",
    ".hk-pair .hk-src { padding: 14px 16px 16px; }",
    ".hk-pair .hk-src-t { font-size: 16px; }",
    "@media (max-width: 640px) { .hk-pair { grid-template-columns: 1fr; } }",
    ".hk-figs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: start; }",
    ".hk-figs .hk-photo img { aspect-ratio: 4 / 3; max-height: none; }",
    ".hk-page .hk-photo { margin-top: 20px; margin-bottom: 4px; }",
    ".hk-note { padding: 14px 18px; border-radius: 15px; background: color-mix(in srgb, var(--lw-orange) 9%, transparent); font-size: 16px; line-height: 1.55; }",
    ".hk-note > b { display: flex; align-items: center; gap: 7px; font-family: var(--font); font-size: 12.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--lw-orange); margin-bottom: 4px; }",
    ".hk-note > b .hk-ic { width: 16px; height: 16px; }",
    ".hk-list > b { display: block; font-family: var(--font); font-size: 13px; font-weight: 650; color: var(--ink-2); margin-bottom: 2px; }",
    ".hk-list ul { list-style: none; margin: 0; padding: 0; }",
    ".hk-list li { display: grid; grid-template-columns: 170px 1fr; gap: 16px; padding: 11px 0; border-bottom: 1px solid var(--hair); font-size: 16px; line-height: 1.5; }",
    ".hk-list li:last-child { border-bottom: 0; }",
    ".hk-list li > b { font-family: var(--font); font-weight: 650; display: flex; gap: 8px; align-items: flex-start; }",
    ".hk-list li > b .hk-ic { width: 20px; height: 20px; color: var(--lw-blue); margin-top: 1px; }",
    ".hk-list li > span { color: var(--ink-2); }",
    "@media (max-width: 560px) { .hk-list li { grid-template-columns: 1fr; gap: 2px; } }",
    ".hk-stat { padding: 16px 0; border-block: 1px solid var(--hair); text-align: center; }",
    ".hk-stat b { display: block; font-family: var(--font); font-size: 40px; font-weight: 650; line-height: 1.05; letter-spacing: -.025em; color: var(--lw-blue); }",
    ".hk-stat span { display: block; margin: 8px auto 0; max-width: 44ch; font-size: 15px; line-height: 1.5; color: var(--ink-2); }",
    ".hk-ask { display: flex; gap: 10px; align-items: flex-start; padding: 12px 16px; border-radius: 14px; background: color-mix(in srgb, var(--lw-purple) 10%, transparent); font-size: 16px; line-height: 1.5; }",
    ".hk-ask .hk-ic { width: 20px; height: 20px; flex: none; margin-top: 2px; color: var(--lw-purple); }",
    ".hk-gloss { margin-top: 10px !important; padding: 11px 15px; border-radius: 13px; font-size: 15.5px; line-height: 1.5; color: var(--ink);",
    "  background: color-mix(in srgb, var(--lw-orange) 12%, var(--paper)); box-shadow: inset 3px 0 0 var(--lw-orange); }",
    ".hk-gloss.src { background: color-mix(in srgb, var(--lw-blue) 12%, var(--paper)); box-shadow: inset 3px 0 0 var(--lw-blue); font-family: var(--text); }",
    ".hk-gloss > b { font-weight: 650; }",
    ".hk-gloss.in { animation: hk-drop .28s cubic-bezier(.2,.7,.2,1) both; }",
    "@keyframes hk-drop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }",
    "@media (prefers-reduced-motion: reduce) { .hk-gloss.in { animation: none; } }",
    ".hk-page-read { font-size: 13.5px; color: var(--ink-2); text-align: left; min-height: 0; }"
  ].join("\n"));
  CH.addKind("page", function (spec, seed, mode) {
    var api = {}, blocks = spec.blocks || [], notes = [], seen = {};
    var box = el("div", "lw hk hk-page");
    // Text for a block, with its tappable words numbered across the page.
    function R(t) { return rich(t, notes).html; }
    function srcCard(o) {
      o = o || {};
      var c = el("div", "hk-src");
      c.setAttribute("data-gloss", "src");
      var head = '<div class="hk-src-h">' + icon(o.i || "scroll") + "<span><small>" + esc(o.kind || "Primary source") + "</small>" +
        (o.title ? "<b>" + fmt(o.title) + "</b>" : "") +
        ((o.who || o.when) ? "<i>" + fmt([o.who, o.when].filter(Boolean).join(" · ")) + "</i>" : "") + "</span></div>";
      var paras = Array.isArray(o.text) ? o.text : [o.text || ""];
      c.innerHTML = head + '<div class="hk-src-t">' + paras.map(function (p) { return "<p>" + R(p) + "</p>"; }).join("") + "</div>" +
        (o.cite ? '<div class="hk-src-c">' + fmt(o.cite) + "</div>" : "");
      return c;
    }
    function add(node, gloss) {
      if (gloss) node.setAttribute("data-gloss", node.getAttribute("data-gloss") || "text");
      box.appendChild(node);
      return node;
    }
    blocks.forEach(function (b) {
      if (b == null) return;
      if (typeof b === "string") b = ["p", b];
      var k = b[0];
      if (k === "p") add(el("p", "hk-p", R(b[1])), true);
      else if (k === "h") add(el("h3", "hk-h", fmt(b[1])));
      else if (k === "def") add(el("div", "hk-def", "<b>" + fmt(b[1]) + "</b><span>" + R(b[2]) + "</span>"), true);
      else if (k === "quote") add(el("blockquote", "hk-quote", "<p>" + fmt(b[1]) + "</p>" + (b[2] ? "<span>" + fmt(b[2]) + "</span>" : "")));
      else if (k === "src") add(srcCard(b[1]), true);
      else if (k === "pair") {
        var pr = el("div", "hk-pair");
        pr.appendChild(srcCard(b[1]));
        pr.appendChild(srcCard(b[2]));
        add(pr);
      }
      else if (k === "fig") add(el("div", "hk-figw", photo(b[1], b[2] ? fmt(b[2]) : "", b[3] || {})));
      else if (k === "figs") add(el("div", "hk-figs", photo(b[1][0], fmt(b[1][1] || "")) + photo(b[2][0], fmt(b[2][1] || ""))));
      else if (k === "note") add(el("div", "hk-note", "<b>" + icon(b[3] || "bulb") + esc(b[1]) + "</b>" + R(b[2])), true);
      else if (k === "list") {
        add(el("div", "hk-list", (b[1] ? "<b>" + esc(b[1]) + "</b>" : "") + "<ul>" + (b[2] || []).map(function (r) {
          return "<li><b>" + (r[2] ? icon(r[2]) : "") + "<span>" + fmt(r[0]) + "</span></b><span>" + R(r[1]) + "</span></li>";
        }).join("") + "</ul>"), true);
      }
      else if (k === "stat") add(el("div", "hk-stat", "<b>" + esc(b[1]) + "</b><span>" + R(b[2]) + "</span>"), true);
      else if (k === "tiles") add(el("div", "hk-tilesw", tiles(b[1], b[2] ? fmt(b[2]) : "")));
      else if (k === "ask") add(el("div", "hk-ask", icon("question") + "<span>" + R(b[1]) + "</span>"), true);
    });
    var terms = [].slice.call(box.querySelectorAll(".hk-term"));
    var status = null;
    if (terms.length) {
      var anySrc = !!box.querySelector(".hk-src .hk-term"), anyText = terms.length > box.querySelectorAll(".hk-src .hk-term").length;
      box.insertBefore(el("div", "hk-tip", icon("search") + "<span>" +
        (anySrc && !anyText ? "Tap a highlighted phrase in the source to read a historian's note on it." :
         anySrc ? "Tap an underlined word to see what it means, and a highlighted phrase to read a note on it." :
         "Tap an underlined word to see what it means.") + "</span>"), box.firstChild);
      if (spec.gate) { status = readout("hk-page-read"); box.appendChild(status); }
    }
    function paint() {
      if (status) {
        var n = Object.keys(seen).length;
        status.textContent = n >= terms.length ? "You've opened all " + terms.length + "." : n + " of " + terms.length + " opened.";
      }
      if (api.onChange) api.onChange();
    }
    function open(t) {
      var host = t.closest("[data-gloss]");
      if (!host) return;
      var n = +t.getAttribute("data-n");
      var was = host._gloss, same = was && was.n === n;
      if (was) { was.node.remove(); was.term.setAttribute("aria-expanded", "false"); host._gloss = null; }
      if (same) return;
      var g = el("div", "hk-gloss" + (host.getAttribute("data-gloss") === "src" ? " src" : "") + (B.reduced() ? "" : " in"),
        "<b>" + esc(t.textContent) + "</b> — " + notes[n]);
      g.setAttribute("role", "note");
      if (host.classList.contains("hk-src")) host.appendChild(g);
      else host.parentNode.insertBefore(g, host.nextSibling);
      host._gloss = { n: n, node: g, term: t };
      t.setAttribute("aria-expanded", "true");
      t.classList.add("seen");
      seen[n] = true;
      paint();
    }
    box.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".hk-term");
      if (t && box.contains(t)) { e.preventDefault(); open(t); }
    });
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? Object.keys(seen).length >= terms.length : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { terms.forEach(function (t) { seen[+t.getAttribute("data-n")] = true; t.classList.add("seen"); }); paint(); };
    return api;
  });

  /* ============================================================== Yearline
     //: yearline   the line of years around 1 BCE | 1 CE: drag a marker across
     //:            it, count the years between two dates, or find a century
     Three modes:
       explore  { from, to, start }         drag the flag; the line says where
                                            you are. Gate: visit both sides.
       count    { a, b }                    two dates fixed; "Count the years"
                                            hops from one to the other, with
                                            the step across the line shown.
                                            Gate: counted.
       century  { from, to, start, goal: [lo, hi] }
                                            drag the flag; the century it is in
                                            lights up. Gate: visit a year in goal.
     Years are signed (−44 is 44 BCE). There is no year 0: 1 BCE is followed
     by 1 CE, and the flag skips straight from one to the other. */
  B.css([
    ".hk-yl .lw-svg { max-height: 230px; touch-action: none; }",
    ".hk-yl-bce { fill: color-mix(in srgb, var(--lw-orange) 14%, transparent); }",
    ".hk-yl-ce { fill: color-mix(in srgb, var(--lw-blue) 14%, transparent); }",
    ".hk-yl-axis { stroke: var(--ink); stroke-width: 2.5; stroke-linecap: round; }",
    ".hk-yl-tk { stroke: var(--ink-2); stroke-width: 1.5; }",
    ".hk-yl-tl { font-size: 12.5px; fill: var(--ink-2); font-variant-numeric: tabular-nums; }",
    ".hk-yl-zero { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 3 4; }",
    ".hk-yl-side { font-size: 13px; font-weight: 700; letter-spacing: .04em; }",
    ".hk-yl-side.b { fill: var(--lw-orange); } .hk-yl-side.c { fill: var(--lw-blue); }",
    ".hk-yl-dir { stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }",
    ".hk-yl-flag line { stroke: var(--ink); stroke-width: 2.5; }",
    ".hk-yl-flag path { fill: var(--lw-red); }",
    ".hk-yl-flag text { font-size: 14px; font-weight: 700; fill: var(--ink); }",
    ".hk-yl-flag rect { fill: var(--paper); stroke: var(--hair); }",
    ".hk-yl-flag:focus { outline: none; } .hk-yl-flag:focus-visible rect { stroke: var(--blue); stroke-width: 2.5; }",
    ".hk-yl-flag .hk-yl-hit { fill: transparent; stroke: none; cursor: ew-resize; }",
    ".hk-yl-band { fill: color-mix(in srgb, var(--lw-green) 22%, transparent); }",
    ".hk-yl-dot { stroke: var(--paper); stroke-width: 3; }",
    ".hk-yl-hop { fill: none; stroke-width: 2.5; stroke-linecap: round; }",
    ".hk-yl-hopl { font-size: 13px; font-weight: 700; }",
    ".hk-yl-log { display: grid; gap: 4px; justify-items: center; font-size: 15.5px; color: var(--ink); }",
    ".hk-yl-log b { font-weight: 650; }",
    ".hk-yl-log .tot { margin-top: 4px; font-size: 17px; }"
  ].join("\n"));
  CH.addKind("yearline", function (spec, seed, mode) {
    var api = {}, md = spec.mode || (spec.a != null ? "count" : "explore");
    var box = el("div", "lw hk hk-yl");
    var W = 680, Hh = md === "count" ? 200 : 206, X0 = 30, X1 = W - 30, AY = md === "count" ? 128 : 108;
    var from, to;
    if (md === "count") {
      var lo = Math.min(spec.a, spec.b), hi = Math.max(spec.a, spec.b), pad = Math.max(3, Math.round((hi - lo) * 0.12));
      from = lo - pad; to = hi + pad;
    } else { from = spec.from != null ? spec.from : -600; to = spec.to != null ? spec.to : 600; }
    // Continuous time t: 1 CE is [0, 1), 1 BCE is [−1, 0). A year's centre is y − ½ (CE) or y + ½ (BCE).
    function tOf(y) { return y > 0 ? y - 0.5 : y + 0.5; }
    function yOf(t) { return t >= 0 ? Math.floor(t) + 1 : Math.floor(t); }
    var t0 = tOf(from), t1 = tOf(to);
    function X(y) { return X0 + (tOf(y) - t0) / (t1 - t0) * (X1 - X0); }
    function Xt(t) { return X0 + (t - t0) / (t1 - t0) * (X1 - X0); }
    function Y(px) { return yOf(t0 + (px - X0) / (X1 - X0) * (t1 - t0)); }
    var svg = svgRoot(W, Hh, "");
    svg.setAttribute("aria-label", "A line of years from " + year(from) + " to " + year(to));
    box.appendChild(svg);
    var zx = Xt(0), crosses = from < 0 && to > 0;
    // The two eras, tinted.
    if (from < 0) S("rect", { x: X0, y: AY - 30, width: Math.max(0, Math.min(zx, X1) - X0), height: 44, rx: 8, class: "hk-yl-bce" }, svg);
    if (to > 0) S("rect", { x: Math.max(zx, X0), y: AY - 30, width: Math.max(0, X1 - Math.max(zx, X0)), height: 44, rx: 8, class: "hk-yl-ce" }, svg);
    var band = S("rect", { x: 0, y: AY - 30, width: 0, height: 44, class: "hk-yl-band" }, svg);
    S("line", { x1: X0, x2: X1, y1: AY, y2: AY, class: "hk-yl-axis" }, svg);
    // Ticks at a round step.
    var range = to - from, step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000].filter(function (s) { return range / s <= 9; })[0] || 5000;
    var first = Math.ceil(from / step) * step;
    for (var v = first; v <= to; v += step) {
      if (v === 0) continue;
      var tx = X(v);
      if (crosses && Math.abs(tx - zx) < 34) continue;
      S("line", { x1: tx, x2: tx, y1: AY - 6, y2: AY + 6, class: "hk-yl-tk" }, svg);
      S("text", { x: tx, y: AY + 24, "text-anchor": "middle", class: "hk-yl-tl" }, svg).textContent = year(v, md === "century");
    }
    if (crosses) {
      S("line", { x1: zx, x2: zx, y1: AY - 36, y2: AY + 20, class: "hk-yl-zero" }, svg);
      S("text", { x: zx - 6, y: AY + 36, "text-anchor": "end", class: "hk-yl-tl" }, svg).textContent = "1 BCE";
      S("text", { x: zx + 6, y: AY + 36, "text-anchor": "start", class: "hk-yl-tl" }, svg).textContent = "1 CE";
      S("text", { x: zx, y: AY + 52, "text-anchor": "middle", class: "hk-yl-tl" }, svg).textContent = "no year 0";
    }
    // Which way each era counts.
    if (md !== "count") {
      // Under the line, where the flag never goes.
      var DY = Hh - 12;
      if (from < 0 && Math.min(zx, X1) - X0 > 240) {
        var bx0 = X0 + 4, bx1 = Math.min(zx, X1) - 44;
        S("text", { x: bx0, y: DY, class: "hk-yl-side b" }, svg).textContent = "BCE — counts DOWN";
        S("path", { d: "M" + (bx0 + 158) + " " + (DY - 5) + " H" + bx1 + " m-7 -5 l7 5 -7 5", class: "hk-yl-dir s-orange" }, svg);
      }
      if (to > 0 && X1 - Math.max(zx, X0) > 240) {
        var cx0 = Math.max(zx, X0) + 44;
        S("text", { x: X1 - 4, y: DY, "text-anchor": "end", class: "hk-yl-side c" }, svg).textContent = "CE — counts UP";
        S("path", { d: "M" + cx0 + " " + (DY - 5) + " H" + (X1 - 132) + " m-7 -5 l7 5 -7 5", class: "hk-yl-dir s-blue" }, svg);
      }
    }
    var read = el("div", "hk-read");
    read.setAttribute("role", "status");
    read.setAttribute("aria-live", "polite");
    box.appendChild(read);

    /* ------------------------------------------------ explore / century */
    var visited = { b: false, c: false }, goalMet = false;
    if (md !== "count") {
      var cur = spec.start != null ? spec.start : Math.round((from + to) / 2) || 1;
      var flag = S("g", { class: "hk-yl-flag", role: "slider", "aria-label": "Year marker",
                          "aria-valuemin": from, "aria-valuemax": to }, svg);
      var hit = S("rect", { x: -22, y: AY - 70, width: 44, height: 84, class: "hk-yl-hit" }, flag);
      S("line", { x1: 0, x2: 0, y1: AY - 62, y2: AY + 8 }, flag);
      S("path", { d: "M0 " + (AY - 62) + " l22 8 -22 8z" }, flag);
      var tagR = S("rect", { x: -48, y: AY - 94, width: 96, height: 26, rx: 13 }, flag);
      var tag = S("text", { x: 0, y: AY - 76, "text-anchor": "middle" }, flag);
      hit.setAttribute("aria-hidden", "true");
      var place = function (y) {
        y = Math.max(from, Math.min(to, y));
        if (y === 0) y = 1;
        cur = y;
        flag.setAttribute("transform", "translate(" + X(y) + ",0)");
        tag.textContent = md === "century" && y > 0 ? String(y) : year(y);
        var tw = Math.max(70, tag.textContent.length * 8.6 + 20);
        tagR.setAttribute("x", -tw / 2); tagR.setAttribute("width", tw);
        flag.setAttribute("aria-valuenow", y);
        flag.setAttribute("aria-valuetext", year(y));
        if (y < 0) visited.b = true; else visited.c = true;
        var c = century(y);
        if (md === "century") {
          // The century as a stretch of continuous time: CE c is [100(c−1), 100c), BCE c is [−100c, −100(c−1)).
          var ta = y > 0 ? (c - 1) * 100 : -c * 100, tb = y > 0 ? c * 100 : -(c - 1) * 100;
          var bx = Xt(Math.max(t0, ta)), bx2 = Xt(Math.min(t1, tb));
          band.setAttribute("x", bx); band.setAttribute("width", Math.max(0, bx2 - bx));
          read.innerHTML = y > 0
            ? "<b>" + y + "</b> is in the <b>" + nth(c) + " century</b> — the years " + ((c - 1) * 100 + 1) + " to " + c * 100 + "."
            : "<b>" + year(y) + "</b> is in the <b>" + nth(c) + " century BCE</b> — the years " + (c * 100) + " to " + ((c - 1) * 100 + 1) + " BCE.";
          if (spec.goal && y >= spec.goal[0] && y <= spec.goal[1]) goalMet = true;
        } else {
          read.innerHTML = y < 0
            ? "<b>" + year(y) + "</b> — " + commas(-y) + (y === -1 ? " year" : " years") + " before the Common Era began." + (y > -4 ? " The very next year is <b>1 CE</b>." : "")
            : "<b>" + year(y) + "</b> — " + (y === 1 ? "the first year" : "year " + commas(y)) + " of the Common Era." + (y < 4 ? " The year before it was <b>1 BCE</b>." : "");
          if (visited.b && visited.c) goalMet = true;
        }
        if (api.onChange) api.onChange();
      };
      var stepK = Math.max(1, Math.round(range / 120));
      draggable(svg, flag, {
        move: function (p) { place(Y(clamp(p.x, X0, X1))); },
        key: function (dx, dy, shift) {
          // Stepping in continuous time skips the missing year 0 by itself.
          var d = dx * (shift ? stepK * 10 : stepK);
          if (d) place(yOf(tOf(cur) + d));
        }
      });
      // Tapping the line moves the flag there too.
      svg.addEventListener("pointerdown", function (e) {
        if (e.target.closest && e.target.closest(".hk-yl-flag")) return;
        var p = svgPt(svg, e);
        if (p.y > AY - 40 && p.y < AY + 30) place(Y(clamp(p.x, X0, X1)));
      });
      place(cur);
      api.reveal = function () {
        if (md === "century" && spec.goal) place(Math.round((spec.goal[0] + spec.goal[1]) / 2));
        else { visited.b = visited.c = true; goalMet = true; place(cur); }
      };
      api.ready = function () { return mode.explore && spec.gate ? goalMet : true; };
      api.check = function () { return { ok: goalMet, say: goalMet ? null : "Drag the flag a little further." }; };
    }

    /* ------------------------------------------------------------ count */
    if (md === "count") {
      var a = spec.a, b = spec.b, lo2 = Math.min(a, b), hi2 = Math.max(a, b), done = false;
      [lo2, hi2].forEach(function (y, k) {
        S("circle", { cx: X(y), cy: AY, r: 8, class: "hk-yl-dot " + (k ? "f-blue" : "f-orange") }, svg);
        S("text", { x: X(y), y: AY + 30 + (crosses ? 32 : 0), "text-anchor": "middle", class: "hk-yl-hopl " + (k ? "f-blue" : "f-orange") }, svg).textContent = year(y);
      });
      var hops = lo2 < 0 && hi2 > 0
        ? [{ a: lo2, b: -1, n: -1 - lo2, c: "orange", say: year(lo2) + " → 1 BCE" },
           { a: -1, b: 1, n: 1, c: "red", say: "1 BCE → 1 CE" },
           { a: 1, b: hi2, n: hi2 - 1, c: "blue", say: "1 CE → " + year(hi2) }].filter(function (h) { return h.n > 0; })
        : [{ a: lo2, b: hi2, n: hi2 - lo2, c: lo2 < 0 ? "orange" : "blue", say: year(lo2) + " → " + year(hi2) }];
      var hopG = S("g", {}, svg);
      var log = el("div", "hk-yl-log");
      read.appendChild(log);
      var go = btn(esc(spec.button || "Count the years"));
      var tools = el("div", "lw-tools");
      tools.appendChild(go);
      box.appendChild(tools);
      var stop = null;
      var drawHop = function (h, k, anim) {
        var xa = X(h.a), xb = X(h.b), mid = (xa + xb) / 2, lift = Math.max(18, Math.min(70, Math.abs(xb - xa) * 0.45));
        var path = S("path", { d: "M" + xa + " " + (AY - 8) + " Q" + mid + " " + (AY - 8 - lift * 2) + " " + xb + " " + (AY - 8), class: "hk-yl-hop s-" + h.c }, hopG);
        var lb = S("text", { x: mid, y: AY - 14 - lift - (h.n === 1 ? 10 : 0), "text-anchor": "middle", class: "hk-yl-hopl f-" + h.c }, hopG);
        lb.textContent = commas(h.n);
        if (anim && !B.reduced() && path.getTotalLength) {
          var L = path.getTotalLength();
          path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
          stop = tween(L, 0, 420, function (v) { path.style.strokeDashoffset = v; });
        }
        log.appendChild(el("div", "", fmt(h.say) + ": <b>" + commas(h.n) + (h.n === 1 ? " year" : " years") + "</b>"));
      };
      var finish = function () {
        done = true;
        tools.hidden = true;
        var total = span(a, b);
        log.appendChild(el("div", "tot", "Total: <b>" + (hops.length > 1 ? hops.map(function (h) { return commas(h.n); }).join(" + ") + " = " : "") + commas(total) + " years</b>"));
        if (api.onChange) api.onChange();
      };
      var k = 0;
      go.addEventListener("click", function () {
        if (done) return;
        drawHop(hops[k], k, true);
        k++;
        if (k >= hops.length) finish(); else go.textContent = "Next hop";
      });
      read.insertBefore(el("div", "", "From <b>" + year(lo2) + "</b> to <b>" + year(hi2) + "</b>. Count it in hops."), log);
      api.reveal = function () { while (k < hops.length) { drawHop(hops[k], k, false); k++; } if (!done) finish(); };
      api.ready = function () { return mode.explore && spec.gate ? done : true; };
      api.check = function () { return { ok: true }; };
      api.destroy = function () { if (stop) stop(); };
    }
    api.el = box;
    return api;
  });

  /* ============================================================== Timeline
     //: timeline   flags on a line of years: tap them to read about each event,
     //:            or, as a problem, drag each flag to its date
       spec: { from: -3000, to: 2000, tol: 200,
               events: [{ y: -2560, short: "Great Pyramid", date: "c. 2560 BCE", i: "pyramid",
                          t: "What happened (explore)" }, …] }
     Explore: the flags stand at their dates; tapping one tells its story in
     the line under the drawing. With gate, Continue waits until each has
     been tapped. As a problem the flags start bunched in the middle and each
     must be dragged to within `tol` years of its date (arrow keys work too).
     The line is labelled, so it tests reading BCE and CE: a date "further
     back" in BCE sits further left. `short`, `date` are plain text; `t` is
     lesson text (formatted by the lab). */
  B.css([
    ".hk-tl .lw-svg { touch-action: none; }",
    ".hk-tl-axis { stroke: var(--ink); stroke-width: 2.5; stroke-linecap: round; }",
    ".hk-tl-tk { stroke: var(--ink-2); stroke-width: 1.5; }",
    ".hk-tl-tl { font-size: 12.5px; fill: var(--ink-2); font-variant-numeric: tabular-nums; }",
    ".hk-tl-zero { stroke: var(--ink-2); stroke-width: 1.5; stroke-dasharray: 3 4; }",
    ".hk-tl-f { cursor: grab; }",
    ".hk-tl-f.on { cursor: grabbing; }",
    ".hk-tl-f line { stroke: var(--ink); stroke-width: 2; }",
    ".hk-tl-f.todo line { stroke-dasharray: 4 4; stroke: var(--ink-2); }",
    ".hk-tl-f rect { fill: var(--paper); stroke: currentColor; stroke-width: 1.8; }",
    ".hk-tl-f.todo rect { stroke-dasharray: 5 4; }",
    ".hk-tl-f.sel rect { stroke-width: 3; }",
    ".hk-tl-f circle { fill: currentColor; }",
    ".hk-tl-f text { font-size: 13px; fill: var(--ink); font-weight: 600; }",
    ".hk-tl-f text.d { font-size: 11.5px; fill: var(--ink-2); font-weight: 500; }",
    ".hk-tl-f:focus { outline: none; } .hk-tl-f:focus-visible rect { stroke: var(--blue); stroke-width: 3; }",
    ".hk-tl-f.no rect { stroke: var(--lw-red); stroke-width: 3; }",
    ".hk-tl-f.yes rect { stroke: var(--lw-green); stroke-width: 3; }"
  ].join("\n"));
  CH.addKind("timeline", function (spec, seed, mode) {
    var api = {}, ev = (spec.events || []).slice(), n = ev.length, explore = !!mode.explore;
    var from = spec.from, to = spec.to;
    if (from == null || to == null) {
      var ys = ev.map(function (e) { return e.y; }), lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pad = (hi - lo) * 0.12 || 50;
      from = lo - pad; to = hi + pad;
    }
    var tol = spec.tol || Math.max(10, Math.round((to - from) * 0.04));
    var box = el("div", "lw hk hk-tl");
    var W = 680, LANE = 44, TOP = 12, Hh = TOP + n * LANE + 64, AY = TOP + n * LANE + 14, X0 = 24, X1 = W - 24;
    function tOf(y) { return y > 0 ? y - 0.5 : y + 0.5; }
    function yOf(t) { return t >= 0 ? Math.floor(t) + 1 : Math.floor(t); }
    var t0 = tOf(from), t1 = tOf(to);
    function X(y) { return X0 + (tOf(y) - t0) / (t1 - t0) * (X1 - X0); }
    function Yr(px) { return yOf(t0 + (px - X0) / (X1 - X0) * (t1 - t0)); }
    var svg = svgRoot(W, Hh, "");
    svg.setAttribute("aria-label", "A timeline from " + year(from) + " to " + year(to));
    box.appendChild(svg);
    S("line", { x1: X0, x2: X1, y1: AY, y2: AY, class: "hk-tl-axis" }, svg);
    var range = to - from, step = spec.step || [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000].filter(function (s) { return range / s <= 7; })[0] || 5000;
    var crosses = from < 0 && to > 0;
    for (var v = Math.ceil(from / step) * step; v <= to; v += step) {
      if (v === 0) continue;
      if (crosses && Math.abs(X(v) - X(1)) < 40) continue;
      S("line", { x1: X(v), x2: X(v), y1: AY - 6, y2: AY + 6, class: "hk-tl-tk" }, svg);
      S("text", { x: X(v), y: AY + 24, "text-anchor": "middle", class: "hk-tl-tl" }, svg).textContent = year(v);
    }
    if (crosses) {
      var zx = (X(-1) + X(1)) / 2;
      S("line", { x1: zx, x2: zx, y1: AY - 10, y2: AY + 10, class: "hk-tl-zero" }, svg);
      S("text", { x: zx, y: AY + 24, "text-anchor": "middle", class: "hk-tl-tl" }, svg).textContent = "1 CE";
    }
    var read = readout();
    box.appendChild(read);
    var COLORS = ["blue", "orange", "green", "purple", "red", "yellow"];
    var sel = null, tapped = {};
    var flags = ev.map(function (e, k) {
      var g = S("g", { class: "hk-tl-f k-" + (e.c || COLORS[k % COLORS.length]) + (explore ? "" : " todo"), tabindex: 0, role: explore ? "button" : "slider",
                       "aria-label": e.short + (e.date ? ", " + e.date : "") }, svg);
      var ly = TOP + k * LANE;
      var pole = S("line", { x1: 0, x2: 0, y1: ly + 17, y2: AY }, g);
      S("circle", { cx: 0, cy: AY, r: 5 }, g);
      var tw = Math.max(String(e.short).length * 7.3, String(e.date || "").length * 6.4) + 46;
      var r = S("rect", { x: 0, y: ly, width: tw, height: 36, rx: 9 }, g);
      var ic = iconAt(g, e.i || "flag", 17, ly + 18, 20, "");
      var t1n = S("text", { x: 32, y: ly + 15 }, g);
      t1n.textContent = e.short;
      var t2n = S("text", { x: 32, y: ly + 29, class: "d" }, g);
      t2n.textContent = e.date || year(e.y);
      var o = { e: e, g: g, rect: r, icon: ic, texts: [t1n, t2n], w: tw, at: explore ? e.y : Math.round((from + to) / 2), moved: explore };
      function side() {
        // Keep the flag on the drawing: it hangs to the left of its pole near the right edge.
        var x = X(o.at), left = x + tw > X1 + 10;
        var dx = left ? -tw : 0;
        r.setAttribute("x", dx);
        ic.setAttribute("transform", "translate(" + (dx + 7) + "," + (ly + 8) + ") scale(" + (20 / 24) + ")");
        t1n.setAttribute("x", dx + 32); t2n.setAttribute("x", dx + 32);
        g.setAttribute("transform", "translate(" + x + ",0)");
      }
      o.place = function (y) {
        y = Math.max(from, Math.min(to, y));
        if (y === 0) y = 1;
        o.at = y;
        side();
        g.setAttribute("aria-valuetext", "near " + year(y));
      };
      o.place(o.at);
      if (explore) {
        var tap = function () {
          flags.forEach(function (f) { f.g.classList.toggle("sel", f === o); });
          tapped[k] = true;
          read.innerHTML = "<b>" + esc(e.date || year(e.y)) + ".</b> " + (e.t || esc(e.short));
          if (api.onChange) api.onChange();
        };
        g.addEventListener("click", tap);
        g.addEventListener("keydown", function (ev2) { if (ev2.key === "Enter" || ev2.key === " ") { ev2.preventDefault(); tap(); } });
      } else {
        var stepK = Math.max(1, Math.round(range / 100));
        draggable(svg, g, {
          start: function () { sel = o; },
          move: function (p) { o.place(Yr(clamp(p.x, X0, X1))); mark(o); },
          key: function (dx, dy, shift) { if (dx) { o.place(yOf(tOf(o.at) + dx * (shift ? stepK * 5 : stepK))); mark(o); } }
        });
      }
      return o;
    });
    function mark(o) {
      o.moved = true;
      o.g.classList.remove("todo", "no", "yes");
      paint();
    }
    function paint() {
      if (!explore) {
        var left = flags.filter(function (f) { return !f.moved; }).length;
        read.innerHTML = left ? "Drag each flag to its date. " + left + " still to place." : "All placed. Check when you're happy.";
      } else if (!Object.keys(tapped).length) read.innerHTML = "Tap a flag to read about it.";
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () {
      if (explore) return spec.gate ? Object.keys(tapped).length >= n : true;
      return flags.every(function (f) { return f.moved; });
    };
    api.check = function () {
      var bad = flags.filter(function (f) { return Math.abs(tOf(f.at) - tOf(f.e.y)) > tol; });
      flags.forEach(function (f) { f.g.classList.toggle("no", bad.indexOf(f) > -1); f.g.classList.toggle("yes", bad.indexOf(f) < 0); });
      if (!bad.length) return { ok: true };
      var f = bad.sort(function (a, b) { return Math.abs(tOf(b.at) - tOf(b.e.y)) - Math.abs(tOf(a.at) - tOf(a.e.y)); })[0];
      var wrongSide = (f.at < 0) !== (f.e.y < 0);
      var say = wrongSide
        ? "**" + f.e.short + "** is " + (f.e.y < 0 ? "BCE — before 1 CE, so it goes to the **left** of it." : "CE — after 1 CE, so it goes to the **right** of it.")
        : f.e.y < 0 && f.at < 0
          ? "**" + f.e.short + "** (" + f.e.date + "): in BCE, a bigger number is further back — so it sits further **" + (f.at > f.e.y ? "left" : "right") + "**."
          : "**" + f.e.short + "** is too far " + (f.at > f.e.y ? "right" : "left") + ". Find " + (f.e.date || year(f.e.y)) + " on the line.";
      return { ok: false, say: fmt(say) };
    };
    api.reveal = function () { flags.forEach(function (f) { f.place(f.e.y); f.moved = true; f.g.classList.remove("todo", "no"); }); paint(); };
    return api;
  });

  /* ============================================================= Truesize
     //: truesize   a Mercator map: drag Greenland toward the equator and it
     //:            shrinks to its true size beside Africa
     The outlines are simplified coastlines in latitude and longitude, drawn
     with the real Mercator formula. Moving Greenland turns it on the globe
     along its meridian (so its true shape and area never change) and draws
     it again where it lands — the map's stretching is what changes.
       spec: { gate, goal: 12 }   Gate: Greenland's middle at or below goal °N.
     Real areas: Greenland 2.17 million km², Africa 30.4 million km² (≈ 1/14). */
  B.css([
    ".hk-ts { display: grid; grid-template-columns: 262px 1fr; gap: 20px; align-items: center; }",
    "@media (max-width: 640px) { .hk-ts { grid-template-columns: 1fr; } .hk-ts .lw-svg { max-width: 262px; margin: 0 auto; } }",
    ".hk-ts .lw-svg { touch-action: none; width: 100%; }",
    ".hk-ts-sea { fill: color-mix(in srgb, var(--lw-blue) 9%, var(--lw-surface)); }",
    ".hk-ts-grat { stroke: var(--lw-grid); stroke-width: 1; fill: none; }",
    ".hk-ts-eq { stroke: var(--ink-2); stroke-width: 1.2; stroke-dasharray: 4 4; }",
    ".hk-ts-gl { font-size: 10.5px; fill: var(--ink-2); }",
    ".hk-ts-af { fill: color-mix(in srgb, var(--lw-orange) 70%, transparent); stroke: var(--lw-orange); stroke-width: 1; }",
    ".hk-ts-gr { fill: color-mix(in srgb, var(--lw-blue) 75%, transparent); stroke: var(--lw-blue); stroke-width: 1.2; cursor: ns-resize; }",
    ".hk-ts-g:focus { outline: none; } .hk-ts-g:focus-visible .hk-ts-gr { stroke: var(--ink); stroke-width: 2.5; }",
    ".hk-ts-ghost { fill: none; stroke: var(--lw-blue); stroke-width: 1.2; stroke-dasharray: 3 3; opacity: .7; }",
    ".hk-ts-name { font-size: 11.5px; font-weight: 700; fill: var(--ink); pointer-events: none; }",
    ".hk-ts-p { display: grid; gap: 14px; }",
    ".hk-ts-p h4 { margin: 0; font-family: var(--font); font-size: 13px; font-weight: 650; letter-spacing: .03em; text-transform: uppercase; color: var(--ink-2); }",
    ".hk-ts-row { display: grid; gap: 5px; }",
    ".hk-ts-row > span { font-size: 14.5px; color: var(--ink); }",
    ".hk-ts-row > span b { font-variant-numeric: tabular-nums; }",
    ".hk-ts-bar { position: relative; height: 16px; border-radius: 8px; background: color-mix(in srgb, var(--lw-orange) 30%, transparent); overflow: hidden; }",
    ".hk-ts-bar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 8px; background: var(--lw-blue); transition: width .15s; }",
    ".hk-ts-key { display: flex; gap: 14px; font-size: 12.5px; color: var(--ink-2); }",
    ".hk-ts-key i { display: inline-block; width: 11px; height: 11px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }",
    ".hk-ts .lw-slider { grid-template-columns: 1fr 104px; }",
    ".hk-ts .lw-slider .lw-sl-name { grid-column: 1 / -1; }",
    ".hk-ts-read { text-align: left; }"
  ].join("\n"));
  var TS_GREEN = [[59.8,-43.9],[60.6,-46.6],[61.4,-48.8],[62.6,-50.2],[64.2,-51.8],[65.6,-53.2],[66.9,-53.8],[68.3,-53.2],[69.3,-51.0],[70.6,-54.2],[71.7,-55.6],[72.9,-56.0],[74.4,-57.6],[75.6,-60.2],[76.2,-66.5],[76.6,-70.0],[77.6,-71.6],[78.6,-72.8],[79.6,-68.2],[80.6,-66.0],[81.6,-61.5],[82.2,-53.0],[82.6,-44.0],[83.5,-34.0],[83.4,-28.0],[82.6,-22.0],[81.6,-16.5],[81.4,-11.8],[80.2,-16.8],[78.8,-18.8],[77.4,-18.3],[76.0,-19.6],[74.6,-19.8],[73.3,-22.0],[72.0,-22.2],[70.6,-21.9],[69.6,-24.2],[68.6,-27.3],[68.0,-30.5],[67.2,-33.6],[66.2,-35.6],[65.5,-38.6],[64.6,-40.2],[63.5,-40.8],[62.4,-42.3],[61.2,-42.8],[60.3,-43.2]];
  var TS_AFRICA = [[35.8,-5.9],[35.2,-2.2],[35.7,-0.6],[36.8,3.1],[37.0,7.7],[37.3,9.8],[36.8,11.1],[35.2,11.2],[34.0,10.3],[33.5,11.1],[32.9,13.2],[32.4,15.2],[31.2,16.6],[30.3,19.0],[31.0,20.1],[32.1,20.1],[32.8,21.8],[32.6,23.1],[32.1,24.0],[31.6,25.2],[31.3,27.2],[31.2,29.9],[31.3,32.3],[29.9,32.5],[28.3,33.2],[27.2,33.8],[25.0,34.9],[22.0,36.8],[19.6,37.2],[17.8,38.6],[15.6,39.5],[13.9,41.2],[12.6,43.3],[11.6,43.1],[11.1,44.3],[11.4,47.4],[11.3,49.0],[11.8,51.3],[10.4,51.2],[8.2,50.0],[6.0,49.0],[3.0,46.5],[1.9,45.3],[0.0,42.6],[-1.7,41.5],[-4.0,39.7],[-6.8,39.3],[-10.3,40.4],[-14.8,40.8],[-16.3,39.9],[-18.0,37.4],[-19.8,34.9],[-21.3,35.4],[-24.0,35.5],[-25.9,32.6],[-28.8,32.1],[-29.9,31.0],[-32.0,29.0],[-33.9,25.6],[-34.2,22.1],[-34.8,20.0],[-34.4,18.5],[-32.7,17.9],[-30.5,17.3],[-28.6,16.5],[-26.6,15.2],[-22.9,14.5],[-19.0,12.6],[-17.0,11.8],[-15.2,12.1],[-12.5,13.5],[-10.7,13.8],[-8.8,13.2],[-6.0,12.3],[-4.5,11.5],[-1.0,8.9],[0.5,9.3],[2.3,9.8],[3.8,9.7],[4.5,8.3],[4.3,6.1],[6.4,3.4],[6.2,1.2],[5.5,-0.2],[4.8,-2.0],[5.1,-4.0],[4.4,-7.7],[6.3,-10.8],[7.2,-12.4],[8.5,-13.2],[9.5,-13.7],[10.5,-15.0],[11.8,-16.7],[12.6,-16.8],[14.7,-17.5],[16.0,-16.5],[18.1,-16.0],[20.8,-17.1],[21.7,-16.9],[24.0,-16.0],[26.0,-14.5],[27.9,-13.0],[28.9,-11.0],[30.4,-9.6],[31.5,-9.8],[33.6,-7.6],[35.1,-6.2]];
  var TS_MADA = [[-12.0,49.3],[-13.4,50.0],[-15.8,50.4],[-17.0,49.9],[-20.4,48.4],[-23.0,47.6],[-25.6,47.1],[-25.1,44.3],[-23.4,43.6],[-21.5,43.5],[-19.8,44.3],[-17.0,44.0],[-15.6,46.4],[-14.0,48.0]];
  CH.addKind("truesize", function (spec, seed, mode) {
    var api = {}, D = Math.PI / 180;
    var LON = [-80, 60], LAT = [-38, 84], MW = 262;
    function my(lat) { return Math.log(Math.tan(Math.PI / 4 + clamp(lat, -85, 85) * D / 2)); }
    function ilat(y) { return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / D; }
    var xa = LON[0] * D, xb = LON[1] * D, ya = my(LAT[0]), yb = my(LAT[1]), K = MW / (xb - xa), MH = Math.round((yb - ya) * K);
    function P(lat, lon) { return [(lon * D - xa) * K, (yb - my(lat)) * K]; }
    function path(pts) { return pts.map(function (p, i) { var q = P(p[0], p[1]); return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("") + "Z"; }
    function area(pts) {
      var s = 0, q = pts.map(function (p) { return P(p[0], p[1]); });
      for (var i = 0; i < q.length; i++) { var a = q[i], b = q[(i + 1) % q.length]; s += a[0] * b[1] - b[0] * a[1]; }
      return Math.abs(s) / 2;
    }
    // Turning a shape on the globe along the meridian lon0, by th radians (south is positive).
    function turn(pts, lon0, th) {
      var k = [-Math.sin(lon0 * D), Math.cos(lon0 * D), 0], c = Math.cos(th), s = Math.sin(th);
      return pts.map(function (p) {
        var la = p[0] * D, lo = p[1] * D, v = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
        var kx = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]], kd = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
        var w = [0, 1, 2].map(function (j) { return v[j] * c + kx[j] * s + k[j] * kd * (1 - c); });
        return [Math.asin(clamp(w[2], -1, 1)) / D, Math.atan2(w[1], w[0]) / D];
      });
    }
    var LAT0 = 72, LON0 = -42, cur = LAT0, goal = spec.goal != null ? spec.goal : 12, reached = false;
    var box = el("div", "lw hk hk-ts");
    var svg = svgRoot(MW, MH, "");
    svg.setAttribute("aria-label", "A Mercator world map showing Greenland and Africa");
    box.appendChild(svg);
    S("rect", { x: 0, y: 0, width: MW, height: MH, rx: 12, class: "hk-ts-sea" }, svg);
    [-30, 30, 60].forEach(function (la) { var y = P(la, 0)[1]; S("line", { x1: 0, x2: MW, y1: y, y2: y, class: "hk-ts-grat" }, svg); S("text", { x: 4, y: y - 3, class: "hk-ts-gl" }, svg).textContent = Math.abs(la) + "°" + (la > 0 ? "N" : "S"); });
    [-60, -30, 0, 30].forEach(function (lo) { var x = P(0, lo)[0]; S("line", { x1: x, x2: x, y1: 0, y2: MH, class: "hk-ts-grat" }, svg); });
    var eqy = P(0, 0)[1];
    S("line", { x1: 0, x2: MW, y1: eqy, y2: eqy, class: "hk-ts-eq" }, svg);
    S("text", { x: 4, y: eqy - 4, class: "hk-ts-gl" }, svg).textContent = "Equator";
    S("path", { d: path(TS_AFRICA), class: "hk-ts-af" }, svg);
    S("path", { d: path(TS_MADA), class: "hk-ts-af" }, svg);
    var afl = P(8, 20);
    S("text", { x: afl[0], y: afl[1], "text-anchor": "middle", class: "hk-ts-name" }, svg).textContent = "AFRICA";
    S("path", { d: path(TS_GREEN), class: "hk-ts-ghost" }, svg);
    var g = S("g", { class: "hk-ts-g", tabindex: 0, role: "slider", "aria-label": "Greenland — move it north or south",
                     "aria-valuemin": 0, "aria-valuemax": LAT0 }, svg);
    var gp = S("path", { class: "hk-ts-gr" }, g);
    var gname = S("text", { "text-anchor": "middle", class: "hk-ts-name" }, g);
    gname.textContent = "GREENLAND";
    var A_AF = area(TS_AFRICA) + area(TS_MADA), REAL = 2.166 / 30.37;

    var panel = el("div", "hk-ts-p");
    panel.appendChild(el("h4", "", "Greenland next to Africa"));
    var r1 = el("div", "hk-ts-row"), r2 = el("div", "hk-ts-row");
    r1.innerHTML = '<span>On this map: <b class="v">–</b> of Africa\'s size</span><div class="hk-ts-bar"><i></i></div>';
    r2.innerHTML = '<span>In reality: <b>' + Math.round(REAL * 100) + '%</b> of Africa\'s size</span><div class="hk-ts-bar"><i style="width:' + (REAL * 100).toFixed(1) + '%"></i></div>';
    panel.appendChild(r1); panel.appendChild(r2);
    panel.appendChild(el("div", "hk-ts-key", '<span><i style="background:var(--lw-blue)"></i>Greenland</span><span><i style="background:color-mix(in srgb, var(--lw-orange) 45%, transparent)"></i>Africa</span>'));
    var sl = slider("Greenland's middle", { min: 0, max: LAT0, step: 1, v: LAT0, show: function (v) { return v + "° north"; } }, function (v) { set(v); });
    panel.appendChild(sl.el);
    var read = readout("hk-ts-read");
    panel.appendChild(read);
    box.appendChild(panel);
    function set(lat) {
      cur = clamp(Math.round(lat), 0, LAT0);
      var pts = turn(TS_GREEN, LON0, (LAT0 - cur) * D);
      gp.setAttribute("d", path(pts));
      var c = P(cur, LON0);
      gname.setAttribute("x", c[0]); gname.setAttribute("y", c[1] + 4);
      gname.style.fontSize = cur > 45 ? "11.5px" : "9px";
      var r = area(pts) / A_AF;
      r1.querySelector(".v").textContent = Math.round(r * 100) + "%";
      r1.querySelector("i").style.width = Math.min(100, r * 100).toFixed(1) + "%";
      sl.set(cur);
      g.setAttribute("aria-valuenow", cur);
      g.setAttribute("aria-valuetext", cur + " degrees north; it looks " + Math.round(r * 100) + " percent of Africa's size");
      if (cur <= goal) reached = true;
      read.innerHTML = cur >= 60 ? "Where it really is, Greenland looks nearly as big as Africa. Drag it south, toward the equator."
        : cur > goal ? "It's shrinking — but Greenland hasn't changed. Keep going."
        : "Near the equator the stretching almost disappears. Greenland is really about <b>1/14</b> the size of Africa.";
      if (api.onChange) api.onChange();
    }
    var grab = null;
    draggable(svg, g, {
      start: function () { grab = null; },
      move: function (p) {
        var at = ilat(yb - p.y / K);
        if (grab == null) grab = cur - at;
        set(at + grab);
      },
      end: function () { grab = null; },
      key: function (dx, dy, shift) { if (dy) set(cur + dy * (shift ? 10 : 2)); }
    });
    set(LAT0);
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? reached : true; };
    api.check = function () { return { ok: reached, say: reached ? null : "Move Greenland all the way down, near the equator." }; };
    api.reveal = function () { set(0); };
    return api;
  });

  /* ================================================================ Layers
     //: layers     Hagia Sophia through time: step through its four lives
     //:            and watch what each one added to the building
     One building read as a stack of primary sources, one for each age that
     changed it. The drawing is the building from the side; each era adds or
     swaps what that age added (the cross on the dome for a crescent, four
     minarets), and a card says what a visitor saw inside and what that
     tells a historian.
       spec: { gate, eras: [{ y, name, outside, inside, tells }] (default: the
               building's four lives, 537 / 1453 / 1934 / 2020) }
     Gate: every era visited. `outside`, `inside`, `tells` are lesson text. */
  B.css([
    ".hk-hs .lw-svg { max-height: 300px; }",
    ".hk-hs-wall { fill: color-mix(in srgb, var(--lw-orange) 36%, var(--lw-tile)); stroke: var(--ink-2); stroke-width: 1.2; }",
    ".hk-hs-dome { fill: color-mix(in srgb, var(--lw-blue) 20%, var(--lw-tile)); stroke: var(--ink-2); stroke-width: 1.2; }",
    ".hk-hs-win { fill: color-mix(in srgb, var(--ink) 30%, transparent); transition: fill .4s; }",
    ".hk-hs.gold .hk-hs-win { fill: var(--lw-yellow); }",
    ".hk-hs-ground { stroke: var(--ink-2); stroke-width: 2; stroke-linecap: round; }",
    ".hk-hs-min { transform-box: fill-box; transform-origin: 50% 100%; transition: transform .45s cubic-bezier(.2,.7,.2,1), opacity .35s; }",
    ".hk-hs-min.off { transform: scaleY(0); opacity: 0; }",
    ".hk-hs-min rect, .hk-hs-min path { fill: var(--lw-tile); stroke: var(--ink-2); stroke-width: 1.2; }",
    ".hk-hs-min .cap { fill: color-mix(in srgb, var(--lw-blue) 30%, var(--lw-tile)); }",
    ".hk-hs-fin { transition: opacity .35s; }",
    ".hk-hs-fin.off { opacity: 0; }",
    ".hk-hs-fin * { stroke: var(--lw-yellow); stroke-width: 3; fill: none; stroke-linecap: round; }",
    ".hk-hs-fin .fill { fill: var(--lw-yellow); stroke: none; }",
    ".hk-hs-ppl { color: var(--ink-2); transition: opacity .35s; } .hk-hs-ppl.off { opacity: 0; }",
    ".hk-hs-yr { font-family: var(--font); font-size: 26px; font-weight: 700; fill: var(--ink); letter-spacing: -.02em; }",
    ".hk-hs-nm { font-size: 14px; font-weight: 600; fill: var(--ink-2); }",
    ".hk-hs-card { border-radius: 16px; background: var(--lw-surface); padding: 14px 18px; display: grid; gap: 7px; font-size: 15.5px; line-height: 1.5; }",
    ".hk-hs-card > div { display: grid; grid-template-columns: 92px 1fr; gap: 10px; }",
    ".hk-hs-card > div > b { font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--ink-2); padding-top: 3px; }",
    ".hk-hs-card > div.t > b { color: var(--lw-orange); }",
    "@media (max-width: 560px) { .hk-hs-card > div { grid-template-columns: 1fr; gap: 0; } }",
    ".hk-hs .hk-seg { justify-self: center; }"
  ].join("\n"));
  var HS_ERAS = [
    { y: 537, name: "A church", k: "church",
      outside: "A vast dome with a cross on top. No towers at all.",
      inside: "Gold mosaics of Christ, Mary, saints and emperors glowing in the light from forty windows.",
      tells: "An emperor showing off his power and his faith: for almost a thousand years, the largest church in the world." },
    { y: 1453, name: "A mosque", k: "mosque",
      outside: "A crescent replaces the cross. Within about 125 years, four minarets rise at the corners.",
      inside: "In time the Christian pictures are plastered over, and Arabic writing is added.",
      tells: "A new empire and a new faith moving in — and choosing to keep the old building, not tear it down." },
    { y: 1934, name: "A museum", k: "museum",
      outside: "The same minarets and dome — but ticket lines at the door.",
      inside: "Mosaics uncovered and restored, shown beside huge round panels of Arabic writing.",
      tells: "A new, modern Turkish state presenting both of the building's pasts to visitors of every faith." },
    { y: 2020, name: "A mosque again", k: "mosque2",
      outside: "Unchanged outside.",
      inside: "Prayers return. The mosaics are covered during prayer times.",
      tells: "The argument over what the building means — and whose it is — is still going on." }
  ];
  CH.addKind("layers", function (spec, seed, mode) {
    var api = {}, eras = spec.eras || HS_ERAS.map(function (e) { return { y: e.y, name: e.name, k: e.k, outside: fmt(e.outside), inside: fmt(e.inside), tells: fmt(e.tells) }; });
    var box = el("div", "lw hk hk-hs");
    var W = 560, Hh = 300, G = 272;
    var svg = svgRoot(W, Hh, "");
    svg.setAttribute("aria-label", "A drawing of Hagia Sophia from the side");
    box.appendChild(svg);
    // Minarets first, so the two at the back sit behind the building.
    function minaret(x, top, cls) {
      var m = S("g", { class: "hk-hs-min off " + (cls || "") }, svg);
      S("rect", { x: x - 6, y: top + 26, width: 12, height: G - top - 26 }, m);
      S("rect", { x: x - 9, y: top + 62, width: 18, height: 6, rx: 2 }, m);
      S("rect", { x: x - 9, y: top + 120, width: 18, height: 6, rx: 2 }, m);
      S("path", { d: "M" + (x - 7) + " " + (top + 26) + "L" + x + " " + top + "L" + (x + 7) + " " + (top + 26) + "Z", class: "cap" }, m);
      return m;
    }
    var mins = [minaret(140, 62), minaret(420, 62), minaret(96, 38), minaret(464, 38)];
    S("line", { x1: 30, x2: 530, y1: G, y2: G, class: "hk-hs-ground" }, svg);
    S("rect", { x: 118, y: 150, width: 34, height: G - 150, class: "hk-hs-wall" }, svg);
    S("rect", { x: 408, y: 150, width: 34, height: G - 150, class: "hk-hs-wall" }, svg);
    S("rect", { x: 152, y: 168, width: 256, height: G - 168, class: "hk-hs-wall" }, svg);
    S("path", { d: "M160 168 Q176 130 222 126 L222 168 Z", class: "hk-hs-dome" }, svg);
    S("path", { d: "M400 168 Q384 130 338 126 L338 168 Z", class: "hk-hs-dome" }, svg);
    S("rect", { x: 222, y: 144, width: 116, height: 24, class: "hk-hs-wall" }, svg);
    for (var i = 0; i < 9; i++) S("rect", { x: 229 + i * 12.2, y: 150, width: 6, height: 12, rx: 3, class: "hk-hs-win" }, svg);
    S("path", { d: "M222 144 A58 52 0 0 1 338 144 Z", class: "hk-hs-dome" }, svg);
    for (var j = 0; j < 7; j++) {
      var wx = 168 + j * 34;
      if (j === 3) continue;
      S("path", { d: "M" + wx + " 238 V214 a9 9 0 0 1 18 0 V238 Z", class: "hk-hs-win" }, svg);
    }
    S("path", { d: "M268 " + G + " V250 a12 12 0 0 1 24 0 V" + G + " Z", class: "hk-hs-win" }, svg);
    var cross = S("g", { class: "hk-hs-fin" }, svg);
    S("path", { d: "M280 92 V64 M271 73 H289" }, cross);
    var cres = S("g", { class: "hk-hs-fin off" }, svg);
    S("path", { d: "M280 92 V80" }, cres);
    S("path", { d: "M285 62 a9 9 0 1 0 0 17 a7 7 0 1 1 0 -17 z", class: "fill" }, cres);
    var ppl = S("g", { class: "hk-hs-ppl off" }, svg);
    [[190, 258], [238, 260], [322, 260], [372, 258]].forEach(function (p) { iconAt(ppl, "people", p[0], p[1], 20); });
    var yr = S("text", { x: 30, y: 44, class: "hk-hs-yr" }, svg);
    var nm = S("text", { x: 30, y: 66, class: "hk-hs-nm" }, svg);
    var picks = seg(eras.map(function (e, k) { return { k: k, label: e.y + " · " + e.name.replace(/^A /, "").replace(/^a /, "") }; }), function (k) { show(k); }, 0);
    box.appendChild(picks.el);
    var cardEl = el("div", "hk-hs-card");
    cardEl.setAttribute("role", "status");
    cardEl.setAttribute("aria-live", "polite");
    box.appendChild(cardEl);
    var seen = {};
    function show(k) {
      var e = eras[k];
      seen[k] = true;
      picks.set(k);
      var church = k === 0;
      box.classList.toggle("gold", church);
      cross.classList.toggle("off", !church);
      cres.classList.toggle("off", church);
      mins.forEach(function (m) { m.classList.toggle("off", church); });
      ppl.classList.toggle("off", k < 2);
      yr.textContent = e.y + " CE";
      nm.textContent = e.name;
      cardEl.innerHTML = "<div><b>Outside</b><span>" + e.outside + "</span></div><div><b>Inside</b><span>" + e.inside + "</span></div>" +
        '<div class="t"><b>It tells us</b><span>' + e.tells + "</span></div>";
      if (api.onChange) api.onChange();
    }
    show(0);
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? Object.keys(seen).length >= eras.length : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { eras.forEach(function (e, k) { seen[k] = true; }); show(eras.length - 1); };
    return api;
  });

  /* ================================================================= Probe
     //: probe      a source and the four questions that turn it into
     //:            evidence — author, audience, intent, context — opened one
     //:            at a time
       spec: { source: { title, who, when, i, text }, gate,
               qs: [{ k: "author" | "audience" | "intent" | "context", a: "…" }, …] }
     Each question's name and wording are built in; `a` is what asking it
     reveals about this source (lesson text). Gate: all four asked. */
  B.css([
    ".hk-pb-src { padding: 14px 18px 16px; border-radius: 16px; background: var(--lw-surface); box-shadow: inset 0 0 0 1px var(--hair); }",
    ".hk-pb-src .hk-src-h { margin-bottom: 8px; }",
    ".hk-pb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }",
    "@media (max-width: 560px) { .hk-pb-grid { grid-template-columns: 1fr; } }",
    ".hk-pb-q { display: grid; gap: 6px; align-content: start; text-align: left; padding: 12px 14px; border-radius: 15px; border: 0; font: inherit; cursor: pointer;",
    "  background: var(--paper); box-shadow: inset 0 0 0 1.5px var(--hair); color: var(--ink); transition: box-shadow .15s; }",
    ".hk-pb-q:hover { box-shadow: inset 0 0 0 1.5px currentColor; }",
    ".hk-pb-q:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }",
    ".hk-pb-q .top { display: flex; align-items: center; gap: 9px; }",
    ".hk-pb-q .top .hk-ic { width: 24px; height: 24px; }",
    ".hk-pb-q .top b { font-family: var(--font); font-size: 16px; font-weight: 650; color: inherit; }",
    ".hk-pb-q .ask { font-size: 14px; line-height: 1.4; color: var(--ink-2); }",
    ".hk-pb-q .ans { display: none; font-size: 15px; line-height: 1.5; color: var(--ink); padding-top: 6px; border-top: 1px solid var(--hair); }",
    ".hk-pb-q.on { box-shadow: inset 0 0 0 2px currentColor; background: color-mix(in srgb, currentColor 7%, var(--paper)); }",
    ".hk-pb-q.on .ans { display: block; }",
    ".hk-pb-q .more { font-size: 12px; color: var(--ink-3); }",
    ".hk-pb-q.on .more { display: none; }"
  ].join("\n"));
  var PB_Q = {
    author: { name: "Author", ask: "Who made it? What was their background, and were they there?", i: "person", c: "blue" },
    audience: { name: "Audience", ask: "Who was it for? Was it public or private?", i: "people", c: "purple" },
    intent: { name: "Intent", ask: "Why was it made? To record, to persuade, to please?", i: "target", c: "orange" },
    context: { name: "Context", ask: "What was going on when it was made?", i: "globe", c: "green" }
  };
  CH.addKind("probe", function (spec, seed, mode) {
    var api = {}, src = spec.source || {}, qs = spec.qs || [], seen = {};
    var box = el("div", "lw hk hk-pb");
    var s = el("div", "hk-pb-src");
    var paras = Array.isArray(src.text) ? src.text : [src.text || ""];
    s.innerHTML = '<div class="hk-src-h">' + icon(src.i || "scroll") + "<span><small>" + esc(src.kind || "Primary source") + "</small>" +
      (src.title ? "<b>" + fmt(src.title) + "</b>" : "") + ((src.who || src.when) ? "<i>" + fmt([src.who, src.when].filter(Boolean).join(" · ")) + "</i>" : "") + "</span></div>" +
      '<div class="hk-src-t">' + paras.map(function (p) { return "<p>" + fmt(p) + "</p>"; }).join("") + "</div>";
    box.appendChild(s);
    var grid = el("div", "hk-pb-grid");
    box.appendChild(grid);
    var read = readout();
    box.appendChild(read);
    var btns = qs.map(function (q, k) {
      var d = PB_Q[q.k] || { name: q.name || "Question", ask: q.ask || "", i: "question", c: "blue" };
      var b = button("hk-pb-q k-" + d.c,
        '<span class="top">' + icon(d.i) + "<b>" + esc(q.name || d.name) + "</b></span>" +
        '<span class="ask">' + esc(q.ask || d.ask) + "</span>" +
        '<span class="more">Tap to ask it</span>' +
        '<span class="ans">' + (q.a || "") + "</span>");
      b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", function () {
        var on = !b.classList.contains("on");
        b.classList.toggle("on", on);
        b.setAttribute("aria-expanded", String(on));
        if (on) seen[k] = true;
        paint();
      });
      grid.appendChild(b);
      return b;
    });
    function paint() {
      var n = Object.keys(seen).length;
      read.innerHTML = n >= qs.length ? "All " + qs.length + " questions asked." : n ? n + " of " + qs.length + " asked." : "Ask each question of the source.";
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? Object.keys(seen).length >= qs.length : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { btns.forEach(function (b, k) { b.classList.add("on"); b.setAttribute("aria-expanded", "true"); seen[k] = true; }); paint(); };
    return api;
  });

  /* ================================================================== Tone
     //: tone       a sentence with words you can swap, and a meter that shows
     //:            how the swap changes its force — rhetoric you can feel
       spec: { parts: ["plain text", { opts: [{ w: "world history", tone: 1, note: "…" },
                                              { w: "infamy", tone: 3, note: "…" }], goal: 1 }, "…"],
               who: "Franklin D. Roosevelt, December 8, 1941", lo: "Flat", hi: "Forceful", gate }
     Tapping a highlighted word swaps it for the next choice; the meter moves
     with the sum of the choices' tones and the line below says what the word
     just chosen does. Gate: every choice set to its goal (the words the
     writer really used). Text in parts, `w` and `note` is formatted here. */
  B.css([
    ".hk-tn-q { padding: 18px 20px; border-radius: 16px; background: var(--lw-surface); box-shadow: inset 0 0 0 1px var(--hair);",
    "  font-family: \"Iowan Old Style\", \"Palatino Linotype\", Palatino, Georgia, serif; font-size: 20px; line-height: 1.65; }",
    ".hk-tn-q small { display: block; margin-top: 10px; font-family: var(--text); font-size: 13px; color: var(--ink-2); }",
    ".hk-tn-w { display: inline; font: inherit; color: var(--lw-blue); background: color-mix(in srgb, var(--lw-blue) 12%, transparent); border: 0; border-bottom: 2px dashed var(--lw-blue);",
    "  padding: 0 4px; margin: 0 1px; border-radius: 5px 5px 0 0; cursor: pointer; }",
    ".hk-tn-w:hover { background: color-mix(in srgb, var(--lw-blue) 20%, transparent); }",
    ".hk-tn-w.goal { color: var(--lw-orange); border-bottom-color: var(--lw-orange); background: color-mix(in srgb, var(--lw-orange) 14%, transparent); }",
    ".hk-tn-w:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }",
    ".hk-tn-w .sw { display: inline-block; width: .8em; height: .8em; margin-left: 4px; vertical-align: -.05em; opacity: .7; }",
    ".hk-tn-m { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; font-size: 13px; font-weight: 600; color: var(--ink-2); }",
    ".hk-tn-track { position: relative; height: 12px; border-radius: 6px; background: linear-gradient(90deg, color-mix(in srgb, var(--ink-2) 25%, transparent), var(--lw-red)); }",
    ".hk-tn-needle { position: absolute; top: -6px; width: 6px; height: 24px; margin-left: -3px; border-radius: 3px; background: var(--ink); box-shadow: 0 0 0 2px var(--paper); transition: left .35s cubic-bezier(.2,.7,.2,1); }"
  ].join("\n"));
  CH.addKind("tone", function (spec, seed, mode) {
    var api = {}, parts = spec.parts || [], slots = [], last = null;
    var box = el("div", "lw hk hk-tn");
    var q = el("div", "hk-tn-q");
    box.appendChild(q);
    parts.forEach(function (p) {
      if (typeof p === "string") { q.appendChild(el("span", "", fmt(p))); return; }
      var o = { p: p, at: p.start || 0 };
      o.b = button("hk-tn-w", "");
      o.b.addEventListener("click", function () { o.at = (o.at + 1) % p.opts.length; last = o; paint(); });
      q.appendChild(o.b);
      slots.push(o);
    });
    if (spec.who) q.appendChild(el("small", "", "— " + fmt(spec.who)));
    var meter = el("div", "hk-tn-m");
    meter.innerHTML = "<span>" + esc(spec.lo || "Flat") + '</span><div class="hk-tn-track"><i class="hk-tn-needle"></i></div><span>' + esc(spec.hi || "Forceful") + "</span>";
    box.appendChild(meter);
    var read = readout();
    box.appendChild(read);
    var SW = '<svg class="sw" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h9l-2.5-2.5M13 11H4l2.5 2.5"/></svg>';
    function tone() {
      var lo = 0, hi = 0, v = 0;
      slots.forEach(function (o) {
        var ts = o.p.opts.map(function (x) { return x.tone || 0; });
        lo += Math.min.apply(null, ts); hi += Math.max.apply(null, ts); v += o.p.opts[o.at].tone || 0;
      });
      return hi > lo ? (v - lo) / (hi - lo) : 0;
    }
    function done() { return slots.every(function (o) { return o.p.goal == null || o.at === o.p.goal; }); }
    function paint() {
      slots.forEach(function (o) {
        var w = o.p.opts[o.at];
        o.b.innerHTML = fmt(w.w) + SW;
        o.b.classList.toggle("goal", o.p.goal != null && o.at === o.p.goal);
        o.b.setAttribute("aria-label", "Word choice: " + String(w.w).replace(/<[^>]+>/g, "") + ". Tap to swap it.");
      });
      meter.querySelector(".hk-tn-needle").style.left = (6 + tone() * 88).toFixed(1) + "%";
      read.innerHTML = last ? fmt(last.p.opts[last.at].note || "") : "Tap a highlighted word to swap it.";
      if (done() && spec.done) read.innerHTML = fmt(spec.done);
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? done() : true; };
    api.check = function () { return { ok: done(), say: done() ? null : "Swap the words until they match what was really said." }; };
    api.reveal = function () { slots.forEach(function (o) { if (o.p.goal != null) o.at = o.p.goal; }); last = null; paint(); };
    return api;
  });

  /* ================================================================ Causes
     //: causes     a pyramid of causes — primary (the spark) at the top,
     //:            secondary below it, tertiary (the broad context) at the
     //:            base: tap it open, or sort causes into it
       spec: { title: "Why …?", levels: [{ t: "…" }, { t }, { t }] (explore),
               cards: [{ t: "…", level: 0 | 1 | 2, fb: "…" }] (problem) }
     Explore: each level of the pyramid opens to show its cause; with gate,
     Continue waits until all three are open. As a problem, the causes sit in
     a tray: tap one, then tap the level it belongs on (tap a placed one to
     take it back). Level names are built in; `t` and `fb` are lesson text. */
  B.css([
    ".hk-cz-title { font-family: var(--font); font-size: 16px; font-weight: 650; text-align: center; color: var(--ink); }",
    ".hk-cz-rows { display: grid; gap: 6px; }",
    ".hk-cz-row { display: grid; grid-template-columns: 180px 1fr; gap: 14px; align-items: stretch; border: 0; padding: 0; background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; border-radius: 14px; }",
    ".hk-cz-row:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }",
    ".hk-cz-row svg { width: 180px; height: 76px; display: block; }",
    ".hk-cz-shape { stroke: var(--paper); stroke-width: 2; }",
    ".hk-cz-row .hk-gic { color: #fff; }",
    ".hk-cz-slot { display: grid; align-content: center; gap: 3px; padding: 9px 14px; border-radius: 14px; background: var(--lw-surface); box-shadow: inset 0 0 0 1.5px var(--hair); min-height: 58px; }",
    ".hk-cz-slot > small { font-size: 11.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }",
    ".hk-cz-slot > span { font-size: 15px; line-height: 1.45; color: var(--ink); }",
    ".hk-cz-slot > span.todo { color: var(--ink-2); font-style: italic; }",
    ".hk-cz-row.target .hk-cz-slot { box-shadow: inset 0 0 0 2px var(--blue); }",
    ".hk-cz-row.no .hk-cz-slot { box-shadow: inset 0 0 0 2px var(--lw-red); }",
    ".hk-cz-row.yes .hk-cz-slot { box-shadow: inset 0 0 0 2px var(--lw-green); }",
    ".hk-cz-tray { display: grid; gap: 8px; }",
    ".hk-cz-card { text-align: left; font: inherit; font-size: 15px; line-height: 1.45; color: var(--ink); padding: 10px 14px; border-radius: 13px; border: 0; cursor: pointer;",
    "  background: var(--paper); box-shadow: inset 0 0 0 1.5px var(--rule, var(--hair)); }",
    ".hk-cz-card:hover { box-shadow: inset 0 0 0 1.5px var(--blue); }",
    ".hk-cz-card.sel { box-shadow: inset 0 0 0 2.5px var(--blue); background: color-mix(in srgb, var(--blue) 9%, var(--paper)); }",
    ".hk-cz-card:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }",
    ".hk-cz-slot .hk-cz-card { padding: 0; background: none; box-shadow: none; font-size: 15px; }",
    "@media (max-width: 560px) { .hk-cz-row { grid-template-columns: 110px 1fr; } .hk-cz-row svg { width: 110px; } }"
  ].join("\n"));
  var CZ_LEVELS = [
    { name: "Primary", sub: "the spark", i: "bolt", c: "green" },
    { name: "Secondary", sub: "one step back", i: "flame", c: "blue" },
    { name: "Tertiary", sub: "the broad context", i: "globe", c: "purple" }
  ];
  CH.addKind("causes", function (spec, seed, mode) {
    var api = {}, explore = !!mode.explore && !spec.cards, lv = CZ_LEVELS.map(function (L, k) { return Object.assign({}, L, (spec.levels || [])[k] || {}); });
    var box = el("div", "lw hk hk-cz");
    if (spec.title) box.appendChild(el("div", "hk-cz-title", fmt(spec.title)));
    var rowsEl = el("div", "hk-cz-rows");
    box.appendChild(rowsEl);
    var opened = {}, place = {}, sel = null;   // place[level] = card index
    var R = LAB.rng(String(seed) + ":cz");
    var cards = (spec.cards || []).map(function (c, k) { return Object.assign({ k: k }, c); });
    var order = R.shuffle(cards.map(function (c) { return c.k; }));
    var rows = lv.map(function (L, k) {
      var r = button("hk-cz-row k-" + L.c, "");
      var W = 180, Hh = 76, wt = W * k / 3, wb = W * (k + 1) / 3;
      var s = svgRoot(W, Hh, "");
      s.setAttribute("aria-hidden", "true");
      S("path", { d: "M" + (W - wt) / 2 + " 0 H" + (W + wt) / 2 + " L" + (W + wb) / 2 + " " + Hh + " H" + (W - wb) / 2 + " Z", class: "hk-cz-shape f-" + L.c }, s);
      iconAt(s, L.i, W / 2, Hh * (k === 0 ? 0.66 : 0.5), 22);
      r.appendChild(s);
      var slot = el("div", "hk-cz-slot");
      r.appendChild(slot);
      rowsEl.appendChild(r);
      r.addEventListener("click", function (e) {
        if (explore) { opened[k] = true; paint(); return; }
        var hit = e.target.closest && e.target.closest(".hk-cz-card");
        if (hit && place[k] != null) { var back = place[k]; delete place[k]; sel = back; paint(); return; }
        if (sel == null) return;
        Object.keys(place).forEach(function (q) { if (place[q] === sel) delete place[q]; });
        // A card already on this level goes back to the tray.
        place[k] = sel;
        sel = null;
        paint();
      });
      return { r: r, slot: slot };
    });
    var tray = el("div", "hk-cz-tray");
    if (!explore) box.appendChild(tray);
    var read = readout();
    box.appendChild(read);
    function paint() {
      rows.forEach(function (o, k) {
        var L = lv[k];
        o.r.classList.remove("no", "yes");
        o.r.classList.toggle("target", !explore && sel != null);
        var head = "<small>" + esc(L.name) + " · " + esc(L.sub) + "</small>";
        if (explore) {
          o.slot.innerHTML = head + (opened[k] ? "<span>" + (L.t || "") + "</span>" : '<span class="todo">Tap to open</span>');
          o.r.setAttribute("aria-label", L.name + " cause" + (opened[k] ? "" : " — tap to open"));
        } else {
          var c = place[k] != null ? cards[place[k]] : null;
          o.slot.innerHTML = head + (c ? '<span class="hk-cz-card" title="Tap to take it back">' + c.t + "</span>" : '<span class="todo">' + (sel != null ? "Tap to put it here" : "Empty") + "</span>");
          o.r.setAttribute("aria-label", L.name + " level" + (c ? ": " + String(c.t).replace(/<[^>]+>/g, "") : ", empty"));
        }
      });
      if (!explore) {
        tray.innerHTML = "";
        order.forEach(function (ci) {
          if (Object.keys(place).some(function (q) { return place[q] === ci; })) return;
          var b = button("hk-cz-card" + (sel === ci ? " sel" : ""), cards[ci].t);
          b.setAttribute("aria-pressed", String(sel === ci));
          b.addEventListener("click", function () { sel = sel === ci ? null : ci; paint(); });
          tray.appendChild(b);
        });
        var left = cards.length - Object.keys(place).length;
        read.innerHTML = left ? (sel != null ? "Now tap the level it belongs on." : "Tap a cause, then tap its level.") : "All placed. Check when you're happy.";
      } else {
        var n = Object.keys(opened).length;
        read.innerHTML = n >= lv.length ? "" : n ? n + " of " + lv.length + " open." : "Tap each level of the pyramid.";
      }
      if (api.onChange) api.onChange();
    }
    paint();
    api.el = box;
    api.ready = function () {
      if (explore) return spec.gate ? Object.keys(opened).length >= lv.length : true;
      return Object.keys(place).length >= Math.min(cards.length, lv.length);
    };
    api.check = function () {
      var wrong = [];
      rows.forEach(function (o, k) {
        var c = place[k] != null ? cards[place[k]] : null;
        var ok = c && c.level === k;
        o.r.classList.toggle("no", !ok);
        o.r.classList.toggle("yes", !!ok);
        if (!ok && c) wrong.push(c);
      });
      if (!wrong.length) return { ok: true };
      var w = wrong[0];
      return { ok: false, say: w.fb || fmt("That one belongs on the **" + lv[w.level].name.toLowerCase() + "** level — " + lv[w.level].sub + ".") };
    };
    api.reveal = function () {
      if (explore) { lv.forEach(function (L, k) { opened[k] = true; }); }
      else { place = {}; cards.forEach(function (c) { if (c.level != null) place[c.level] = c.k; }); sel = null; }
      paint();
    };
    return api;
  });

  /* ================================================================== Lens
     //: lens       one past, six historians: pick a lens and see what it
     //:            brings into focus in a colonial town, and what it asks
     A drawn town in colonial Latin America (1500s–1820s) — a silver mine and
     its miners, a farm, a church, the town council, the market, a household,
     books — and, past a line, the same region today. Each lens lights up
     what that kind of historian looks at and dims the rest, and the card
     says the question it asks and the sources it reaches for.
       spec: { gate, lenses: [{ name, c, on: [keys], ask, uses }] (default: six) }
     Gate: every lens tried. `ask` and `uses` are lesson text. */
  B.css([
    ".hk-ln .lw-svg { max-height: 280px; }",
    ".hk-ln-bg { fill: var(--lw-surface); }",
    ".hk-ln-hill { fill: color-mix(in srgb, var(--lw-orange) 16%, var(--lw-surface)); }",
    ".hk-ln-road { stroke: color-mix(in srgb, var(--ink-2) 35%, transparent); stroke-width: 6; fill: none; stroke-linecap: round; }",
    ".hk-ln-div { stroke: var(--ink-2); stroke-width: 1.5; stroke-dasharray: 5 5; }",
    ".hk-ln-era { font-size: 12px; font-weight: 700; letter-spacing: .05em; fill: var(--ink-2); }",
    ".hk-ln-it { transition: opacity .3s; color: var(--ink); }",
    ".hk-ln-it.dim { opacity: .22; }",
    ".hk-ln-it.lit.k-blue { color: var(--lw-blue); } .hk-ln-it.lit.k-purple { color: var(--lw-purple); } .hk-ln-it.lit.k-green { color: var(--lw-green); }",
    ".hk-ln-it.lit.k-red { color: var(--lw-red); } .hk-ln-it.lit.k-orange { color: var(--lw-orange); } .hk-ln-it.lit.k-yellow { color: var(--lw-yellow); }",
    ".hk-ln-it .halo { fill: transparent; stroke: transparent; stroke-width: 3; transition: fill .3s, stroke .3s; }",
    ".hk-ln-it.lit .halo { fill: color-mix(in srgb, currentColor 16%, transparent); stroke: currentColor; }",
    ".hk-ln-it text { font-size: 11.5px; fill: var(--ink); font-weight: 600; }",
    ".hk-ln-card { border-radius: 16px; background: var(--lw-surface); padding: 14px 18px; display: grid; gap: 6px; font-size: 15.5px; line-height: 1.5; min-height: 96px; }",
    ".hk-ln-card h4 { margin: 0; font-family: var(--font); font-size: 17px; font-weight: 650; }",
    ".hk-ln-card > div { display: grid; grid-template-columns: 78px 1fr; gap: 10px; }",
    ".hk-ln-card > div > b { font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--ink-2); padding-top: 3px; }",
    ".hk-ln .hk-seg { justify-self: center; justify-content: center; }"
  ].join("\n"));
  var LN_ITEMS = [
    { k: "mine", i: "mine", x: 70, y: 92, t: "Silver mine" },
    { k: "workers", i: "worker", x: 130, y: 170, t: "Miners" },
    { k: "farm", i: "wheat", x: 62, y: 214, t: "Farm" },
    { k: "church", i: "church", x: 222, y: 70, t: "Church" },
    { k: "books", i: "book", x: 206, y: 176, t: "Books, letters" },
    { k: "council", i: "capitol", x: 312, y: 84, t: "Town council" },
    { k: "market", i: "basket", x: 296, y: 200, t: "Market" },
    { k: "house", i: "house", x: 392, y: 150, t: "Household" },
    { k: "city", i: "factory", x: 548, y: 92, t: "City today" },
    { k: "gap", i: "coins", x: 548, y: 190, t: "Rich and poor today" }
  ];
  var LN_LENSES = [
    { name: "Progressive", c: "blue", on: ["council"],
      ask: "Did government grow more democratic — councils, laws, a say for more people?",
      uses: "Council minutes, laws, petitions, the first constitutions." },
    { name: "Intellectual", c: "purple", on: ["books", "church"],
      ask: "What ideas did people write and argue about — faith, nature, freedom?",
      uses: "Books, sermons, letters, and writings by Indigenous thinkers." },
    { name: "Social", c: "green", on: ["market", "farm", "house"],
      ask: "What did ordinary people eat, how did they work, and whom did they marry?",
      uses: "Market records, church registers of births and marriages, wills." },
    { name: "Marxist", c: "red", on: ["mine", "workers", "farm"],
      ask: "Who did the work, who kept the profits — and when did workers fight back?",
      uses: "Mine accounts, tax and labor lists, records of riots and revolts." },
    { name: "Gender", c: "orange", on: ["house", "church", "market"],
      ask: "How did ideas about men's and women's roles shape people's lives?",
      uses: "Marriage contracts, court cases, convent records." },
    { name: "Postcolonial", c: "yellow", on: ["city", "gap", "workers"],
      ask: "How do the racism and poverty of colonial rule still shape life long after independence?",
      uses: "Present-day records, histories told from the side of the colonized." }
  ];
  CH.addKind("lens", function (spec, seed, mode) {
    var api = {}, lenses = spec.lenses || LN_LENSES.map(function (L) { return Object.assign({}, L, { ask: fmt(L.ask), uses: fmt(L.uses) }); });
    var box = el("div", "lw hk hk-ln");
    var W = 640, Hh = 262;
    var svg = svgRoot(W, Hh, "");
    svg.setAttribute("aria-label", "A colonial town in Latin America, and the same region today");
    box.appendChild(svg);
    S("rect", { x: 0, y: 0, width: W, height: Hh, rx: 16, class: "hk-ln-bg" }, svg);
    S("path", { d: "M0 150 L34 72 L58 98 L92 46 L140 118 L168 150 Z", class: "hk-ln-hill" }, svg);
    S("path", { d: "M150 232 C240 216 300 238 440 214", class: "hk-ln-road" }, svg);
    S("line", { x1: 470, x2: 470, y1: 16, y2: Hh - 16, class: "hk-ln-div" }, svg);
    S("text", { x: 20, y: 26, class: "hk-ln-era" }, svg).textContent = "1500s–1820s";
    S("text", { x: 490, y: 26, class: "hk-ln-era" }, svg).textContent = "TODAY";
    var nodes = {};
    LN_ITEMS.forEach(function (it) {
      var g = S("g", { class: "hk-ln-it" }, svg);
      S("circle", { cx: it.x, cy: it.y, r: 26, class: "halo" }, g);
      iconAt(g, it.i, it.x, it.y, 30);
      S("text", { x: it.x, y: it.y + 42, "text-anchor": "middle" }, g).textContent = it.t;
      nodes[it.k] = g;
    });
    var picks = seg(lenses.map(function (L, k) { return { k: k, label: L.name }; }), function (k) { show(k); }, -1);
    box.appendChild(picks.el);
    var cardEl = el("div", "hk-ln-card");
    cardEl.setAttribute("role", "status");
    cardEl.setAttribute("aria-live", "polite");
    box.appendChild(cardEl);
    var seen = {};
    function show(k) {
      var L = lenses[k];
      seen[k] = true;
      picks.set(k);
      Object.keys(nodes).forEach(function (key) {
        var on = L.on.indexOf(key) > -1, g = nodes[key];
        g.classList.toggle("dim", !on);
        g.classList.toggle("lit", on);
        g.setAttribute("class", g.getAttribute("class").replace(/ k-\w+/g, "") + (on ? " k-" + L.c : ""));
      });
      cardEl.innerHTML = "<h4 class=\"k-" + L.c + "\">" + esc(L.name) + " history</h4><div><b>Asks</b><span>" + L.ask + "</span></div><div><b>Uses</b><span>" + L.uses + "</span></div>";
      if (api.onChange) api.onChange();
    }
    cardEl.innerHTML = "<h4>Pick a lens</h4><div><b>Then</b><span>See what that historian looks at in the same place and time — and what fades from view.</span></div>";
    api.el = box;
    api.ready = function () { return mode.explore && spec.gate ? Object.keys(seen).length >= lenses.length : true; };
    api.check = function () { return { ok: true }; };
    api.reveal = function () { lenses.forEach(function (L, k) { seen[k] = true; }); show(lenses.length - 1); };
    return api;
  });

  window.OPLO_LAB.histkitReady = true;
})();
